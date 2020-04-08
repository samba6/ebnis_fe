import { DataProxy } from "apollo-cache";
import immer, { Draft } from "immer";
import { UpdateExperiencesOnlineMutationResult } from "../graphql/experiences.gql";
import { readExperienceFragment } from "./read-experience-fragment";
import { writeExperienceFragmentToCache } from "./write-experience-fragment";
import { UpdateExperienceFragment } from "../graphql/apollo-types/UpdateExperienceFragment";
import { ExperienceFragment } from "../graphql/apollo-types/ExperienceFragment";
import { DataDefinitionFragment } from "../graphql/apollo-types/DataDefinitionFragment";
import { floatExperiencesToTopInGetExperiencesMiniQuery } from "./update-get-experiences-mini-query";
import { EntryConnectionFragment_edges } from "../graphql/apollo-types/EntryConnectionFragment";
import { EntryFragment } from "../graphql/apollo-types/EntryFragment";
import {
  getUnsyncedExperience,
  writeUnsyncedExperience,
  removeUnsyncedExperience,
  UnsyncedModifiedExperience,
} from "../apollo-cache/unsynced.resolvers";
import { DataObjectFragment } from "../graphql/apollo-types/DataObjectFragment";
import { entryToEdge } from "../state/resolvers/entry-to-edge";

export const StateValues = {
  ownFieldsCleanUp: "clean-up-own-fields" as OwnFieldsCleanUp,
  ownFieldsNoCleanUp: "no-clean-up-own-fields" as OwnFieldsNoCleanUp,
  newEntriesCleanUp: "clean-up-new-entries" as NewEntriesCleanUp,
  newEntriesNoCleanUp: "no-clean-up-new-entries" as NewEntriesNoCleanUp,
};

export function updateExperiencesInCache(onDone?: () => void) {
  return function updateExperiencesInCacheInner(
    dataProxy: DataProxy,
    result: UpdateExperiencesOnlineMutationResult,
  ) {
    const successfulResults = filterSuccessfulUpdates(result);
    const cachedExperienceToUpdateDataList = mapUpdatedDataToCachedExperience(
      dataProxy,
      successfulResults,
    );

    const [updatedExperiences, cleanUpDataList] = applyUpdatesAndGetCleanUpData(
      cachedExperienceToUpdateDataList,
    );

    const updatedIds: { [experienceId: string]: 1 } = {};

    updatedExperiences.forEach(experience => {
      writeExperienceFragmentToCache(dataProxy, experience);
      updatedIds[experience.id] = 1;
    });

    cleanUpDataList.forEach(([experienceId, ...data]) => {
      const unsynced = getUnsyncedExperience(experienceId);

      if (unsynced) {
        const updatedUnsynced = updateUnSyncedLedger(unsynced, data);

        if (!Object.keys(updatedUnsynced).length) {
          removeUnsyncedExperience(experienceId);
        } else {
          writeUnsyncedExperience(experienceId, updatedUnsynced);
        }
      }
    });

    floatExperiencesToTopInGetExperiencesMiniQuery(dataProxy, updatedIds);

    // istanbul ignore next:
    if (onDone) {
      onDone();
    }
  };
}

export function filterSuccessfulUpdates(
  result: UpdateExperiencesOnlineMutationResult,
) {
  const updateExperiences =
    result && result.data && result.data.updateExperiences;

  if (!updateExperiences) {
    return [];
  }

  if (updateExperiences.__typename === "UpdateExperiencesAllFail") {
    return [];
  } else {
    return updateExperiences.experiences.reduce((acc, updateResult) => {
      if (updateResult.__typename === "UpdateExperienceSomeSuccess") {
        acc.push(updateResult.experience);
      }

      return acc;
    }, [] as UpdateExperienceFragment[]);
  }
}

export function applyUpdatesAndGetCleanUpData(
  results: [ExperienceFragment, UpdateExperienceFragment][],
): [ExperienceFragment[], AllCleanUpData] {
  const updatedExperiences: ExperienceFragment[] = [];
  const cleanUpData = [] as AllCleanUpData;

  results.forEach(([experience, updateResult]) => {
    const updatedExperience = immer(experience, proxy => {
      const ownFieldsCleanUp = ownFieldsApplyUpdatesAndGetCleanUpData(
        proxy,
        updateResult,
      );

      const dataDefinitionsCleanUp = definitionsApplyUpdatesAndGetCleanUpData(
        proxy,
        updateResult,
      );

      const newEntriesCleanUp = newEntriesApplyUpdatesAndGetCleanUpData(
        proxy,
        updateResult,
      );

      const updatedEntriesCleanUp = updatedEntriesApplyUpdatesAndGetCleanUpData(
        proxy,
        updateResult,
      );

      cleanUpData.push([
        experience.id,
        ownFieldsCleanUp,
        dataDefinitionsCleanUp,
        newEntriesCleanUp,
        updatedEntriesCleanUp,
      ]);
    });

    updatedExperiences.push(updatedExperience);
  });

  return [updatedExperiences, cleanUpData];
}

function updatedEntriesApplyUpdatesAndGetCleanUpData(
  proxy: DraftState,
  { updatedEntries }: UpdateExperienceFragment,
): UpdatedEntriesCleanUp {
  const idsToCleanUp: UpdatedEntriesCleanUp = [];

  if (!updatedEntries) {
    return idsToCleanUp;
  }

  const updatesMap = updatedEntries.reduce((entriesIdsAcc, update) => {
    if (update.__typename === "UpdateEntrySomeSuccess") {
      const { entryId, dataObjects } = update.entry;

      const [dataObjectsIdsToCleanUp, dataObjectUpdates] = dataObjects.reduce(
        (dataObjectsAcc, data) => {
          const [dataObjectsIdsToCleanUp, dataObjectUpdates] = dataObjectsAcc;

          if (data.__typename === "DataObjectSuccess") {
            const { dataObject } = data;
            const { id } = dataObject;
            dataObjectUpdates[id] = dataObject;
            dataObjectsIdsToCleanUp.push(id);
          }

          return dataObjectsAcc;
        },
        [[], {}] as [string[], IdToDataObjectMap],
      );

      if (dataObjectsIdsToCleanUp.length) {
        entriesIdsAcc[entryId] = dataObjectUpdates;
        idsToCleanUp.push([entryId, ...dataObjectsIdsToCleanUp]);
      }
    }

    return entriesIdsAcc;
  }, {} as EntryIdToDataObjectMap);

  if (idsToCleanUp.length) {
    (proxy.entries.edges as EntryConnectionFragment_edges[]).forEach(e => {
      const edge = e as EntryConnectionFragment_edges;
      const node = edge.node as EntryFragment;
      const { id: entryId } = node;
      const idToUpdatedDataObjectMap = updatesMap[entryId];

      if (idToUpdatedDataObjectMap) {
        node.dataObjects = node.dataObjects.map(d => {
          const dataObject = d as DataObjectFragment;
          const { id } = dataObject;
          const updatedDataObject = idToUpdatedDataObjectMap[id];
          return updatedDataObject || dataObject;
        });
      }
    });
  }

  return idsToCleanUp;
}

function newEntriesApplyUpdatesAndGetCleanUpData(
  proxy: DraftState,
  { newEntries }: UpdateExperienceFragment,
): ShouldCleanUpNewEntries {
  if (!newEntries) {
    return StateValues.newEntriesNoCleanUp;
  }

  let hasOfflineSyncedEntryError = false;
  const brandNewEntries: EntryFragment[] = [];
  const offlineSyncedEntries: IdToOfflineEntrySynced = {};

  newEntries.forEach(update => {
    if (update.__typename === "CreateEntrySuccess") {
      const { entry } = update;
      const { clientId } = entry;

      if (clientId) {
        // offline synced
        offlineSyncedEntries[clientId] = entry;
      } else {
        // brand new entry
        brandNewEntries.push(entry);
      }
    } else {
      const clientId =
        update.errors && update.errors.meta && update.errors.meta.clientId;

      if (clientId) {
        // offline synced
        hasOfflineSyncedEntryError = true;
      }
    }
  });

  const edges = proxy.entries.edges as EntryConnectionFragment_edges[];

  const isOfflineEntrySynced = Object.keys(offlineSyncedEntries).length !== 0;

  if (isOfflineEntrySynced) {
    edges.forEach(e => {
      const edge = e as EntryConnectionFragment_edges;
      const node = edge.node as EntryFragment;
      const newEntry = offlineSyncedEntries[node.id];
      if (newEntry) {
        edge.node = newEntry;
      }
    });
  }

  proxy.entries.edges = brandNewEntries
    .map(entry => entryToEdge(entry))
    .concat(edges);

  const shouldCleanUp = hasOfflineSyncedEntryError
    ? StateValues.newEntriesNoCleanUp // errors! we can't clean up
    : isOfflineEntrySynced
    ? StateValues.newEntriesCleanUp // all synced, we *must* clean up
    : StateValues.newEntriesNoCleanUp; // nothing synced, no errors

  return shouldCleanUp;
}

function definitionsApplyUpdatesAndGetCleanUpData(
  proxy: DraftState,
  { updatedDefinitions }: UpdateExperienceFragment,
): string[] {
  if (!updatedDefinitions) {
    return [];
  }

  let hasSuccess = false;
  const definitionsIdsToCleanUp: string[] = [];

  const updates = updatedDefinitions.reduce((acc, update) => {
    if (update.__typename === "DefinitionSuccess") {
      hasSuccess = true;
      const { definition } = update;
      const { id } = definition;
      acc[id] = definition;
      definitionsIdsToCleanUp.push(id);
    }
    return acc;
  }, {} as IdToDataDefinition);

  if (hasSuccess) {
    proxy.dataDefinitions = proxy.dataDefinitions.map(d => {
      const definition = d as DataDefinitionFragment;
      const { id } = definition;
      const update = updates[id];
      return update ? update : definition;
    });
  }

  return definitionsIdsToCleanUp;
}

function ownFieldsApplyUpdatesAndGetCleanUpData(
  proxy: DraftState,
  { ownFields }: UpdateExperienceFragment,
): ShouldCleanUpOwnFields {
  if (!ownFields) {
    return StateValues.ownFieldsNoCleanUp;
  }

  if (ownFields.__typename === "UpdateExperienceOwnFieldsErrors") {
    return StateValues.ownFieldsNoCleanUp;
  } else {
    const { title, description } = ownFields.data;
    proxy.title = title;
    proxy.description = description;
    return StateValues.ownFieldsCleanUp;
  }
}

function mapUpdatedDataToCachedExperience(
  dataProxy: DataProxy,
  results: UpdateExperienceFragment[],
) {
  return results.reduce((acc, result) => {
    const experience = readExperienceFragment(dataProxy, result.experienceId);

    if (experience) {
      acc.push([experience, result]);
    }

    return acc;
  }, [] as [ExperienceFragment, UpdateExperienceFragment][]);
}

export function updateUnSyncedLedger(
  unsynced: UnsyncedModifiedExperience,
  [
    shouldCleanUpOwnFields,
    definitionsIdsToCleanUp,
    shouldCleanUpNewEntries,
    entryIdDataObjectsIdsToCleanUp,
  ]: CleanUpData,
) {
  if (shouldCleanUpOwnFields === StateValues.ownFieldsCleanUp) {
    delete unsynced.ownFields;
  }

  if (definitionsIdsToCleanUp.length) {
    const unsyncedDefinitions = unsynced.definitions;

    if (unsyncedDefinitions) {
      definitionsIdsToCleanUp.forEach(id => {
        delete unsyncedDefinitions[id];
      });

      if (!Object.keys(unsyncedDefinitions).length) {
        delete unsynced.definitions;
      }
    }
  }

  if (shouldCleanUpNewEntries === StateValues.newEntriesCleanUp) {
    delete unsynced.newEntries;
  }

  if (entryIdDataObjectsIdsToCleanUp.length) {
    const { modifiedEntries: unsyncedEntries } = unsynced;

    if (unsyncedEntries) {
      entryIdDataObjectsIdsToCleanUp.forEach(
        ([entryId, ...dataObjectsIdsToCleanUp]) => {
          const unsyncedEntry = unsyncedEntries[entryId];

          if (unsyncedEntry) {
            dataObjectsIdsToCleanUp.forEach(dataId => {
              delete unsyncedEntry[dataId];
            });

            if (!Object.keys(unsyncedEntry).length) {
              delete unsyncedEntries[entryId];
            }
          }
        },
      );

      if (!Object.keys(unsyncedEntries).length) {
        delete unsynced.modifiedEntries;
      }
    }
  }

  return unsynced;
}

type DraftState = Draft<ExperienceFragment>;

interface IdToDataObjectMap {
  [dataObjectId: string]: DataObjectFragment;
}

type AllCleanUpData = [
  string, // experienceId
  ShouldCleanUpOwnFields,
  DataDefinitionsIdsToCleanUp,
  ShouldCleanUpNewEntries,
  UpdatedEntriesCleanUp,
][];

// [
//   shouldCleanUpOwnFields,
//   dataDefinitionIdsToCleanUp,
//   shouldCleanUpNewEntries,
//   [entryIdToCleanUp, ...dataObjectsIdsToCleanUp][]
// ]
export type CleanUpData = [
  ShouldCleanUpOwnFields,
  DataDefinitionsIdsToCleanUp,
  ShouldCleanUpNewEntries,
  UpdatedEntriesCleanUp,
];

type OwnFieldsUpdates = Pick<ExperienceFragment, "title" | "description">;
type ShouldCleanUpOwnFields = OwnFieldsCleanUp | OwnFieldsNoCleanUp;

export type DataDefinitionsIdsToCleanUp = string[];
type DefinitionsUpdatesAndCleanUp = [IdToDataDefinition | null, string[]];

interface IdToDataDefinition {
  [definitionId: string]: DataDefinitionFragment;
}

type NewEntriesUpdates = [EntryFragment[], IdToOfflineEntrySynced | null];
type ShouldCleanUpNewEntries = NewEntriesCleanUp | NewEntriesNoCleanUp;

interface IdToOfflineEntrySynced {
  [clientId: string]: EntryFragment;
}

interface EntryIdToDataObjectMap {
  [entryId: string]: IdToDataObjectMap;
}

type UpdatedEntriesCleanUp = string[][];

type OwnFieldsCleanUp = "clean-up-own-fields";
type OwnFieldsNoCleanUp = "no-clean-up-own-fields";
type NewEntriesCleanUp = "clean-up-new-entries";
type NewEntriesNoCleanUp = "no-clean-up=new-entries";

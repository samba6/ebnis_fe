import { DataProxy } from "apollo-cache";
import immer, { Draft } from "immer";
import { UpdateExperiencesOnlineMutationResult } from "../graphql/experiences.gql";
import { readExperienceFragment } from "./read-experience-fragment";
import { writeExperienceFragmentToCache } from "./write-experience-fragment";
import { UpdateExperienceFragment } from "../graphql/apollo-types/UpdateExperienceFragment";
import { ExperienceFragment } from "../graphql/apollo-types/ExperienceFragment";
import { DataDefinitionFragment } from "../graphql/apollo-types/DataDefinitionFragment";
import { floatExperiencesToTheTopInGetExperiencesMiniQuery } from "./update-get-experiences-mini-query";
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
  ownFieldsHasErrors: "has-own-fields-errors" as OwnFieldsHasErrors,
  ownFieldsNoErrors: "no-own-fields-errors" as OwnFieldsNoErrors,
  dataDefinitionsHasErrors: "data-definitions-has-errors" as DataDefinitionsHasErrors,
  dataDefinitionsNoErrors: "data-definitions-no-errors" as DataDefinitionsNoErrors,
  newEntriesHasErrors: "new-entries-has-errors" as NewEntriesHasErrors,
  newEntriesNoErrors: "new-entries-no-errors" as NewEntriesNoErrors,
  updatedEntriesHasErrors: "updated-entries-has-errors" as UpdatedEntriesHasErrors,
  updatedEntriesNoErrors: "updated-entries-no-errors" as UpdatedEntriesNoErrors,
};

export function getSuccessfulResults(
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

export function getUpdatesAndCleanUpData(
  results: [ExperienceFragment, UpdateExperienceFragment][],
): UpdatesDataAndCleanUp {
  const [updatesData, cleanUpData] = [[], []] as UpdatesDataAndCleanUp;

  results.forEach(([experience, updateResult]) => {
    const [
      ownFieldsUpdates,
      ownFieldsCleanUp,
    ] = getOwnFieldsUpdatesAndCleanUpData(updateResult);

    const [
      dataDefinitionsUpdates,
      dataDefinitionsCleanUp,
    ] = getDefinitionsUpdatesAndCleanUpData(updateResult);

    const [
      newEntriesUpdates,
      newEntriesCleanUp,
    ] = getNewEntriesUpdatesAndCleanUpData(updateResult);

    const [
      updatedEntriesUpdates,
      updatedEntriesCleanUp,
    ] = getUpdatedEntriesUpdatesAndCleanUpData(updateResult);

    updatesData.push([
      experience,
      ownFieldsUpdates,
      dataDefinitionsUpdates,
      newEntriesUpdates,
      updatedEntriesUpdates,
    ]);

    cleanUpData.push([
      experience.id,
      ownFieldsCleanUp,
      dataDefinitionsCleanUp,
      newEntriesCleanUp,
      updatedEntriesCleanUp,
    ]);
  });

  return [updatesData, cleanUpData];
}

export function applyUpdatesToExperiences(updateData: UpdatesData) {
  return updateData.reduce(
    (
      acc,
      [
        experience,
        ownFieldsUpdates,
        definitionsUpdates,
        newEntriesUpdates,
        updatedEntriesUpdates,
      ],
    ) => {
      const updatedExperience = immer(experience, proxy => {
        applyOwnFieldsChanges(proxy, ownFieldsUpdates);
        applyDefinitionsChanges(proxy, definitionsUpdates);
        applyNewEntriesChanges(proxy, newEntriesUpdates);
        applyUpdatedEntriesChanges(proxy, updatedEntriesUpdates);
      });

      acc.push(updatedExperience);
      return acc;
    },

    [] as ExperienceFragment[],
  );
}

function applyUpdatedEntriesChanges(
  proxy: DraftState,
  updatedEntriesUpdates: EntryIdToDataObjectMap | null,
) {
  if (!updatedEntriesUpdates) {
    return;
  }

  (proxy.entries.edges as EntryConnectionFragment_edges[]).forEach(e => {
    const edge = e as EntryConnectionFragment_edges;
    const node = edge.node as EntryFragment;
    const { id: entryId } = node;
    const idToUpdatedDataObjectMap = updatedEntriesUpdates[entryId];

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

function applyNewEntriesChanges(
  proxy: DraftState,
  newEntriesUpdates: NewEntriesUpdates | null,
) {
  if (!newEntriesUpdates) {
    return;
  }

  const [brandNewEntries, offlineSyncedEntries] = newEntriesUpdates;
  const edges = proxy.entries.edges as EntryConnectionFragment_edges[];

  if (offlineSyncedEntries) {
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
}

function applyDefinitionsChanges(
  proxy: DraftState,
  definitionsUpdates: IdToDataDefinition | null,
) {
  if (!definitionsUpdates) {
    return;
  }

  proxy.dataDefinitions = proxy.dataDefinitions.map(d => {
    const definition = d as DataDefinitionFragment;
    const { id } = definition;
    const update = definitionsUpdates[id];
    return update ? update : definition;
  });
}

function applyOwnFieldsChanges(
  proxy: DraftState,
  ownFieldsUpdates: OwnFieldsUpdates | null,
) {
  if (!ownFieldsUpdates) {
    return;
  }

  const { title, description } = ownFieldsUpdates;
  proxy.title = title;
  proxy.description = description;
}

function getUpdatedEntriesUpdatesAndCleanUpData({
  updatedEntries,
}: UpdateExperienceFragment): UpdatedEntriesUpdatesAndCleanUp {
  const idsToCleanUp: string[][] = [];

  if (!updatedEntries) {
    return [null, idsToCleanUp];
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

  return [idsToCleanUp.length ? updatesMap : null, idsToCleanUp];
}

function getNewEntriesUpdatesAndCleanUpData({
  newEntries,
}: UpdateExperienceFragment): NewEntriesUpdatesAndCleanUp {
  if (!newEntries) {
    return [null, StateValues.newEntriesNoCleanUp];
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

  const isOfflineEntrySynced = Object.keys(offlineSyncedEntries).length !== 0;

  const shouldCleanUp = hasOfflineSyncedEntryError
    ? StateValues.newEntriesNoCleanUp // errors! we can't clean up
    : isOfflineEntrySynced
    ? StateValues.newEntriesCleanUp // all synced, we *must* clean up
    : StateValues.newEntriesNoCleanUp; // nothing synced, no errors

  return [
    isOfflineEntrySynced || brandNewEntries.length
      ? [brandNewEntries, isOfflineEntrySynced ? offlineSyncedEntries : null]
      : null,
    shouldCleanUp,
  ];
}

function getDefinitionsUpdatesAndCleanUpData({
  updatedDefinitions,
}: UpdateExperienceFragment): DefinitionsUpdatesAndCleanUp {
  if (!updatedDefinitions) {
    return [null, []];
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

  return [hasSuccess ? updates : null, definitionsIdsToCleanUp];
}

function getOwnFieldsUpdatesAndCleanUpData({
  ownFields,
}: UpdateExperienceFragment): OwnFieldsUpdatesAndCleanUp {
  if (!ownFields) {
    return [null, StateValues.ownFieldsNoCleanUp];
  }

  if (ownFields.__typename === "UpdateExperienceOwnFieldsErrors") {
    return [null, StateValues.ownFieldsNoCleanUp];
  } else {
    const {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      __typename,
      ...rest
    } = ownFields.data;
    return [rest, StateValues.ownFieldsCleanUp];
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

export function updateExperiencesInCache(onDone?: () => void) {
  return function updateExperiencesInCacheInner(
    dataProxy: DataProxy,
    result: UpdateExperiencesOnlineMutationResult,
  ) {
    const successfulResults = getSuccessfulResults(result);
    const cachedExperienceToUpdateDataList = mapUpdatedDataToCachedExperience(
      dataProxy,
      successfulResults,
    );

    const [updatesList, cleanUpDataList] = getUpdatesAndCleanUpData(
      cachedExperienceToUpdateDataList,
    );

    const updatedExperiences = applyUpdatesToExperiences(updatesList);

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

    floatExperiencesToTheTopInGetExperiencesMiniQuery(dataProxy, updatedIds);

    // istanbul ignore next:
    if (onDone) {
      onDone();
    }
  };
}

type DraftState = Draft<ExperienceFragment>;

type UpdatedEntriesIdsToDelete = [string, string[]][];

type HasError = boolean;

type UpdateEntriesResult = [HasError, [string, string[]][]];

interface IdToDataObjectMap {
  [dataObjectId: string]: DataObjectFragment;
}

export type UpdatesData = [
  ExperienceFragment,
  OwnFieldsUpdates | null,
  null | IdToDataDefinition,
  null | NewEntriesUpdates,
  null | EntryIdToDataObjectMap,
][];

export type UpdatesDataAndCleanUp = [
  UpdatesData,
  // clean up data
  [
    string, // experienceId
    ShouldCleanUpOwnFields,
    DataDefinitionsIdsToCleanUp,
    ShouldCleanUpNewEntries,
    UpdatedEntriesCleanUp,
  ][],
];

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

type OwnFieldsUpdatesAndCleanUp = [
  null | OwnFieldsUpdates,
  ShouldCleanUpOwnFields,
];
type OwnFieldsUpdates = Pick<ExperienceFragment, "title" | "description">;
type ShouldCleanUpOwnFields = OwnFieldsCleanUp | OwnFieldsNoCleanUp;

export type DataDefinitionsIdsToCleanUp = string[];
type DefinitionsUpdatesAndCleanUp = [IdToDataDefinition | null, string[]];

interface IdToDataDefinition {
  [definitionId: string]: DataDefinitionFragment;
}

type NewEntriesUpdatesAndCleanUp = [
  NewEntriesUpdates | null,
  ShouldCleanUpNewEntries,
];

type NewEntriesUpdates = [EntryFragment[], IdToOfflineEntrySynced | null];
type ShouldCleanUpNewEntries = NewEntriesCleanUp | NewEntriesNoCleanUp;

interface IdToOfflineEntrySynced {
  [clientId: string]: EntryFragment;
}

type UpdatedEntriesUpdatesAndCleanUp = [
  null | EntryIdToDataObjectMap,
  UpdatedEntriesCleanUp,
];

interface EntryIdToDataObjectMap {
  [entryId: string]: IdToDataObjectMap;
}

type UpdatedEntriesCleanUp = string[][];

type OwnFieldsCleanUp = "clean-up-own-fields";
type OwnFieldsNoCleanUp = "no-clean-up-own-fields";
type NewEntriesCleanUp = "clean-up-new-entries";
type NewEntriesNoCleanUp = "no-clean-up=new-entries";
type OwnFieldsHasErrors = "has-own-fields-errors";
type OwnFieldsNoErrors = "no-own-fields-errors";
type DataDefinitionsHasErrors = "data-definitions-has-errors";
type DataDefinitionsNoErrors = "data-definitions-no-errors";
type NewEntriesHasErrors = "new-entries-has-errors";
type NewEntriesNoErrors = "new-entries-no-errors";
type UpdatedEntriesHasErrors = "updated-entries-has-errors";
type UpdatedEntriesNoErrors = "updated-entries-no-errors";

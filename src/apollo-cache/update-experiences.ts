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

export function mapUpdateDataAndErrors(
  results: [ExperienceFragment, UpdateExperienceFragment][],
): MapUpdateDataAndErrors {
  return results.map(([experience, updateResult]) => {
    return [
      experience,
      mapOwnFieldsUpdatesAndErrors(updateResult),
      mapDefinitionsUpdatesAndErrors(updateResult),
      mapNewEntriesUpdatesAndErrors(updateResult),
      mapUpdatedEntriesUpdatesAndErrors(updateResult),
    ];
  });
}

export function getChangesAndCleanUpData(
  updateData: MapUpdateDataAndErrors,
): ChangedExperienceAndCleanUpData {
  const updatedExperiences: ExperienceFragment[] = [];
  const allCleanUpData: AllCleanUpData = [];

  updateData.forEach(
    ([
      experience,
      [ownFieldsUpdates, ownFieldsErrorsStatus],
      [definitionsUpdates, hasDefinitionsErrors],
      [newEntriesUpdates, newEntriesErrorStatus],
      [updatedEntriesUpdates, hasUpdatedEntriesErrors],
    ]) => {
      if (
        ownFieldsErrorsStatus === StateValues.ownFieldsHasErrors &&
        hasDefinitionsErrors === StateValues.dataDefinitionsHasErrors &&
        newEntriesErrorStatus === StateValues.newEntriesHasErrors &&
        hasUpdatedEntriesErrors === StateValues.updatedEntriesHasErrors
      ) {
        return;
      }

      const cleanUpData = ([] as unknown) as CleanUpData;
      allCleanUpData.push([experience.id, cleanUpData]);

      const updatedExperience = immer(experience, proxy => {
        applyOwnFieldsChanges(proxy, ownFieldsUpdates);

        cleanUpData.push(
          ownFieldsErrorsStatus === StateValues.ownFieldsHasErrors
            ? StateValues.ownFieldsNoCleanUp
            : StateValues.ownFieldsCleanUp,
        );

        const dataDefinitionIdsToCleanUp = applyDefinitionsChanges(
          proxy,
          definitionsUpdates,
        );

        cleanUpData.push(dataDefinitionIdsToCleanUp);

        applyNewEntriesChanges(proxy, newEntriesUpdates);

        cleanUpData.push(
          newEntriesErrorStatus === StateValues.newEntriesHasErrors
            ? StateValues.newEntriesNoCleanUp
            : StateValues.newEntriesCleanUp,
        );

        const entryIdDataObjectsIdsToCleanUp = applyUpdatedEntriesChanges(
          proxy,
          updatedEntriesUpdates,
        );

        cleanUpData.push(entryIdDataObjectsIdsToCleanUp);
      });

      updatedExperiences.push(updatedExperience);
    },
  );

  return [updatedExperiences, allCleanUpData];
}

function applyUpdatedEntriesChanges(
  proxy: DraftState,
  updatedEntriesUpdates: MapUpdatedEntriesSuccesses | null,
) {
  const idsToCleanUp: string[][] = [];

  if (!updatedEntriesUpdates) {
    return idsToCleanUp;
  }

  (proxy.entries.edges as EntryConnectionFragment_edges[]).forEach(e => {
    const edge = e as EntryConnectionFragment_edges;
    const node = edge.node as EntryFragment;
    const { id: entryId } = node;
    const idToUpdatedDataObjectMap = updatedEntriesUpdates[entryId];

    if (idToUpdatedDataObjectMap) {
      const dataObjectsIdsToCleanUp: string[] = [];

      node.dataObjects = node.dataObjects.map(d => {
        const dataObject = d as DataObjectFragment;
        const { id } = dataObject;
        const updatedDataObject = idToUpdatedDataObjectMap[id];

        if (updatedDataObject) {
          dataObjectsIdsToCleanUp.push(id);
          return updatedDataObject;
        }

        return dataObject;
      });

      if (dataObjectsIdsToCleanUp.length) {
        idsToCleanUp.push([entryId, ...dataObjectsIdsToCleanUp]);
      }
    }
  });

  return idsToCleanUp;
}

function applyNewEntriesChanges(
  proxy: DraftState,
  newEntriesUpdates: MapNewEntriesUpdatesSuccesses | null,
) {
  if (!newEntriesUpdates) {
    return;
  }

  (proxy.entries.edges as EntryConnectionFragment_edges[]).forEach(e => {
    const edge = e as EntryConnectionFragment_edges;
    const node = edge.node as EntryFragment;
    const newEntry = newEntriesUpdates[node.id];
    if (newEntry) {
      edge.node = newEntry;
    }
  });
}

function applyDefinitionsChanges(
  proxy: DraftState,
  definitionsUpdates: MapDefinitionsUpdatesSuccesses | null,
): string[] {
  const dataDefinitionIdsToCleanUp: string[] = [];

  if (!definitionsUpdates) {
    return dataDefinitionIdsToCleanUp;
  }

  proxy.dataDefinitions = proxy.dataDefinitions.map(d => {
    const definition = d as DataDefinitionFragment;
    const { id } = definition;
    const update = definitionsUpdates[id];

    if (update) {
      dataDefinitionIdsToCleanUp.push(id);
      return update;
    }
    return definition;
  });

  return dataDefinitionIdsToCleanUp;
}

function applyOwnFieldsChanges(
  proxy: DraftState,
  ownFieldsUpdates: MapOwnFieldsUpdatesSuccess | null,
) {
  if (!ownFieldsUpdates) {
    return;
  }

  const { title, description } = ownFieldsUpdates;
  proxy.title = title;
  proxy.description = description;
}

function mapUpdatedEntriesUpdatesAndErrors({
  updatedEntries,
}: UpdateExperienceFragment): MapUpdatedEntriesUpdatesAndErrors {
  let errorStatus: UpdatedEntriesHasErrors | UpdatedEntriesNoErrors =
    StateValues.updatedEntriesNoErrors;

  if (!updatedEntries) {
    return [null, errorStatus];
  }

  let hasSuccess = false;
  const updates = updatedEntries.reduce((entriesIdsAcc, update) => {
    if (update.__typename === "UpdateEntrySomeSuccess") {
      const { entryId, dataObjects } = update.entry;
      let hasLocalSuccess = false;

      const dataObjectUpdates = dataObjects.reduce((dataObjectsAcc, data) => {
        if (data.__typename === "DataObjectSuccess") {
          hasSuccess = true;
          hasLocalSuccess = true;
          const { dataObject } = data;
          dataObjectsAcc[dataObject.id] = dataObject;
        } else {
          errorStatus = StateValues.updatedEntriesHasErrors;
        }

        return dataObjectsAcc;
      }, {} as IdToDataObjectMap);

      if (hasLocalSuccess) {
        entriesIdsAcc[entryId] = dataObjectUpdates;
      }
    } else {
      errorStatus = StateValues.updatedEntriesHasErrors;
    }
    return entriesIdsAcc;
  }, {} as MapUpdatedEntriesSuccesses);

  return [hasSuccess ? updates : null, errorStatus];
}

function mapNewEntriesUpdatesAndErrors({
  newEntries,
}: UpdateExperienceFragment): MapNewEntriesUpdatesAndErrors {
  let errorStatus: NewEntriesErrorsStatus = StateValues.newEntriesNoErrors;

  if (!newEntries) {
    return [null, errorStatus];
  }

  let hasSuccess = false;

  const updates = newEntries.reduce((acc, update) => {
    if (update.__typename === "CreateEntrySuccess") {
      hasSuccess = true;
      const { entry } = update;
      acc[entry.clientId as string] = entry;
    } else {
      errorStatus = StateValues.newEntriesHasErrors;
    }

    return acc;
  }, {} as MapNewEntriesUpdatesSuccesses);

  return [hasSuccess ? updates : null, errorStatus];
}

function mapDefinitionsUpdatesAndErrors({
  updatedDefinitions,
}: UpdateExperienceFragment): MapDefinitionsUpdatesAndErrors {
  let errorStatus: DataDefinitionsHasErrors | DataDefinitionsNoErrors =
    StateValues.dataDefinitionsNoErrors;

  if (!updatedDefinitions) {
    return [null, errorStatus];
  }

  let hasSuccess = false;

  const updates = updatedDefinitions.reduce((acc, update) => {
    if (update.__typename === "DefinitionSuccess") {
      hasSuccess = true;
      const { definition } = update;
      acc[definition.id] = definition;
    } else {
      errorStatus = StateValues.dataDefinitionsHasErrors;
    }
    return acc;
  }, {} as MapDefinitionsUpdatesSuccesses);

  return [hasSuccess ? updates : null, errorStatus];
}

function mapOwnFieldsUpdatesAndErrors({
  ownFields,
}: UpdateExperienceFragment): MapOwnFieldsUpdatesAndErrors {
  let errorStatus: OwnFieldsHasErrors | OwnFieldsNoErrors =
    StateValues.ownFieldsNoErrors;

  if (!ownFields) {
    return [null, errorStatus];
  }

  if (ownFields.__typename === "UpdateExperienceOwnFieldsErrors") {
    errorStatus = StateValues.ownFieldsHasErrors;
    return [null, errorStatus];
  } else {
    const {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      __typename,
      ...rest
    } = ownFields.data;
    return [rest, errorStatus];
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

export function cleanUpSynced(
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

    const updateData = mapUpdateDataAndErrors(cachedExperienceToUpdateDataList);

    const [
      updatedExperiences, //
      cleanUpDataList,
    ] = getChangesAndCleanUpData(updateData);

    const updatedIds: { [experienceId: string]: 1 } = {};
    updatedExperiences.forEach(experience => {
      writeExperienceFragmentToCache(dataProxy, experience);
      updatedIds[experience.id] = 1;
    });

    cleanUpDataList.forEach(([experienceId, data]) => {
      const unsynced = getUnsyncedExperience(experienceId);

      if (unsynced) {
        const updatedUnsynced = cleanUpSynced(unsynced, data);

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

type AddEntriesResult = HasError;

type ExperienceAndUpdateData = [
  ExperienceFragment,
  UpdateOwnFieldsResult,
  UpdateDefinitionsResults,
  AddEntriesResult,
  UpdateEntriesResult,
];

type UpdateDefinitionsResults = [HasError, string[]];

type DraftState = Draft<ExperienceFragment>;

interface MapUpdatedEntriesSuccesses {
  [entryId: string]: IdToDataObjectMap;
}

type UpdatedEntriesIdsToDelete = [string, string[]][];

type HasError = boolean;

type UpdateEntriesResult = [HasError, [string, string[]][]];

interface IdToDataObjectMap {
  [dataObjectId: string]: DataObjectFragment;
}

type UpdateOwnFieldsResult = HasError;

export type MapUpdateDataAndErrors = [
  ExperienceFragment,
  MapOwnFieldsUpdatesAndErrors,
  MapDefinitionsUpdatesAndErrors,
  MapNewEntriesUpdatesAndErrors,
  MapUpdatedEntriesUpdatesAndErrors,
][];

type MapOwnFieldsUpdatesSuccess = Pick<
  ExperienceFragment,
  "title" | "description"
>;

type MapOwnFieldsUpdatesAndErrors = [
  null | MapOwnFieldsUpdatesSuccess,
  OwnFieldsHasErrors | OwnFieldsNoErrors,
];

export type MapDefinitionsUpdatesAndErrors = [
  null | MapDefinitionsUpdatesSuccesses,
  DataDefinitionsHasErrors | DataDefinitionsNoErrors,
];

interface MapDefinitionsUpdatesSuccesses {
  [definitionId: string]: DataDefinitionFragment;
}

export type MapNewEntriesUpdatesAndErrors = [
  null | MapNewEntriesUpdatesSuccesses,
  NewEntriesErrorsStatus,
];

type NewEntriesErrorsStatus = NewEntriesHasErrors | NewEntriesNoErrors;

interface MapNewEntriesUpdatesSuccesses {
  [clientId: string]: EntryFragment;
}

export type MapUpdatedEntriesUpdatesAndErrors = [
  null | MapUpdatedEntriesSuccesses,
  UpdatedEntriesHasErrors | UpdatedEntriesNoErrors,
];

type ChangedExperienceAndCleanUpData = [ExperienceFragment[], AllCleanUpData];

// [
//   shouldCleanUpOwnFields,
//   dataDefinitionIdsToCleanUp,
//   shouldCleanUpNewEntries,
//   [entryIdToCleanUp, ...dataObjectsIdsToCleanUp][]
// ]
export type CleanUpData = [
  OwnFieldsCleanUp | OwnFieldsNoCleanUp,
  string[],
  NewEntriesCleanUp | NewEntriesNoCleanUp,
  string[][],
];

type AllCleanUpData = [string, CleanUpData][];

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

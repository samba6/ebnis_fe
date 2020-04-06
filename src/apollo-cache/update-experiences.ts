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
import { entryToEdge } from "../state/resolvers/entry-to-edge";
import { EntryFragment } from "../graphql/apollo-types/EntryFragment";
import {
  getUnsyncedExperience,
  writeUnsyncedExperience,
  removeUnsyncedExperience,
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

        const shouldCleanUpNewEntries = applyNewEntriesChanges(
          proxy,
          newEntriesUpdates,
          newEntriesErrorStatus,
        );

        cleanUpData.push(shouldCleanUpNewEntries);

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
  errorStatus: NewEntriesErrorsStatus,
) {
  if (!newEntriesUpdates) {
    return errorStatus === StateValues.newEntriesHasErrors
      ? StateValues.newEntriesNoCleanUp
      : StateValues.newEntriesCleanUp;
  }

  let shouldCleanUp: NewEntriesCleanUp | NewEntriesNoCleanUp =
    StateValues.newEntriesNoCleanUp;

  (proxy.entries.edges as EntryConnectionFragment_edges[]).forEach(e => {
    const edge = e as EntryConnectionFragment_edges;
    const node = edge.node as EntryFragment;
    const newEntry = newEntriesUpdates[node.id];
    if (newEntry) {
      edge.node = newEntry;
      shouldCleanUp = StateValues.newEntriesCleanUp;
    }
  });

  return shouldCleanUp;
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
  let errorStatus = StateValues.newEntriesNoErrors;

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
  let errorStatus = StateValues.ownFieldsNoErrors;

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

// istanbul ignore next:
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

export function updateExperiencesInCache1(onDone?: () => void) {
  return function updateExperiencesInCacheInner(
    dataProxy: DataProxy,
    result: UpdateExperiencesOnlineMutationResult,
  ) {
    // istanbul ignore next:
    if (onDone) {
      onDone();
    }
  };
}

export function updateExperiencesInCache(onDone?: () => void) {
  return function updateExperiencesInCacheInner(
    dataProxy: DataProxy,
    result: UpdateExperiencesOnlineMutationResult,
  ) {
    const updateExperiences =
      result && result.data && result.data.updateExperiences;

    if (!updateExperiences) {
      return;
    }

    let hasUpdates = false;
    const updatedIds: { [experienceId: string]: 1 } = {};

    if (updateExperiences.__typename === "UpdateExperiencesSomeSuccess") {
      const { experiences: updateResults } = updateExperiences;

      for (const updateResult of updateResults) {
        if (updateResult.__typename === "UpdateExperienceSomeSuccess") {
          const { experience: result } = updateResult;
          const { experienceId, updatedAt } = result;

          const experience = readExperienceFragment(dataProxy, experienceId);

          if (!experience) {
            continue;
          }

          hasUpdates = true;
          updatedIds[experienceId] = 1;

          const updatedExperience = immer(experience, proxy => {
            proxy.updatedAt = updatedAt;

            const hasOwnFieldsErrors = updateOwnFields(proxy, result);
            const hasNewEntriesErrors = addEntries(proxy, result);

            const [
              hasUpdatedEntriesErrors,
              updatedEntriesIdsToDelete,
            ] = updateEntries(proxy, result);

            const [hasDefinitionsErrors, definitionIds] = updateDefinitions(
              proxy,
              result,
            );

            const hasError =
              hasDefinitionsErrors ||
              hasNewEntriesErrors ||
              hasOwnFieldsErrors ||
              hasUpdatedEntriesErrors;

            if (!hasError) {
              proxy.hasUnsaved = null;
            }

            updateUnsynced(
              experienceId,
              hasOwnFieldsErrors,
              hasNewEntriesErrors,
              hasDefinitionsErrors,
              definitionIds,
              hasUpdatedEntriesErrors,
              updatedEntriesIdsToDelete,
            );
          });

          writeExperienceFragmentToCache(dataProxy, updatedExperience);
        }
      }
    }

    if (!hasUpdates) {
      return;
    }

    floatExperiencesToTheTopInGetExperiencesMiniQuery(dataProxy, updatedIds);
    if (onDone) {
      onDone();
    }
  };
}

function updateOwnFields(proxy: DraftState, result: UpdateExperienceFragment) {
  const ownFields = result.ownFields;
  let hasErrors = false;

  if (!ownFields) {
    return hasErrors;
  }

  if (ownFields.__typename === "ExperienceOwnFieldsSuccess") {
    const {
      data: { title, description },
    } = ownFields;
    proxy.title = title;
    proxy.description = description;

    return hasErrors;
  }

  hasErrors = true;
  return hasErrors;
}

function updateEntries(
  proxy: DraftState,
  result: UpdateExperienceFragment,
): [boolean, UpdatedEntriesIdsToDelete] {
  let hasErrors = false;
  const { updatedEntries } = result;

  if (!updatedEntries) {
    return [hasErrors, []];
  }

  let hasUpdates = false;
  const deletes: UpdatedEntriesIdsToDelete = [];

  const updates = updatedEntries.reduce((acc, e) => {
    if (e.__typename === "UpdateEntrySomeSuccess") {
      const { entryId, dataObjects } = e.entry;
      const dataObjectsIdsToDelete: string[] = [];
      const idToUpdatedDataObjectMap = {} as IdToDataObjectMap;
      let hasDataObjectError = false;

      dataObjects.forEach(d => {
        if (d.__typename === "DataObjectSuccess") {
          const { dataObject } = d;
          const { id } = dataObject;
          idToUpdatedDataObjectMap[id] = dataObject;
          acc[entryId] = idToUpdatedDataObjectMap;
          dataObjectsIdsToDelete.push(id);
          hasUpdates = true;
        } else {
          hasDataObjectError = true;
        }
      });

      if (hasDataObjectError) {
        // if there are data object errors, we only purge data objects that
        // succeed
        deletes.push([entryId, dataObjectsIdsToDelete]);
        hasErrors = true;
      } else {
        // if no data object errors, we purge the entire entryId
        deletes.push([entryId, []]);
      }
    } else {
      hasErrors = true;
    }

    return acc;
  }, {} as MapUpdatedEntriesSuccesses);

  if (hasUpdates) {
    (proxy.entries.edges as EntryConnectionFragment_edges[]).forEach(edge => {
      const node = (edge as EntryConnectionFragment_edges)
        .node as EntryFragment;

      const idToUpdatedDataObjectMap = updates[node.id];

      if (idToUpdatedDataObjectMap) {
        node.dataObjects = node.dataObjects.map(d => {
          const dataObject = d as DataObjectFragment;
          return idToUpdatedDataObjectMap[dataObject.id] || dataObject;
        });
      }
    });
  }

  return [hasErrors, deletes];
}

function updateDefinitions(
  proxy: DraftState,
  result: UpdateExperienceFragment,
): [boolean, string[]] {
  const updatedDefinitions = result.updatedDefinitions;
  const updatedDefinitionIds: string[] = [];
  let hasErrors = false;

  if (!updatedDefinitions) {
    return [hasErrors, updatedDefinitionIds];
  }

  let hasUpdates = false;

  const updates = updatedDefinitions.reduce((acc, d) => {
    if (d.__typename === "DefinitionSuccess") {
      hasUpdates = true;
      const { definition } = d;
      const { id } = definition;
      acc[id] = definition;
      updatedDefinitionIds.push(id);
    } else {
      hasErrors = true;
    }

    return acc;
  }, {} as { [definitionId: string]: DataDefinitionFragment });

  if (!hasUpdates) {
    return [hasErrors, updatedDefinitionIds];
  }

  proxy.dataDefinitions = proxy.dataDefinitions.map(d => {
    const definition = d as DataDefinitionFragment;
    return updates[definition.id] || definition;
  });

  return [hasErrors, updatedDefinitionIds];
}

function addEntries(proxy: DraftState, result: UpdateExperienceFragment) {
  const newEntries = result.newEntries;
  let hasErrors = false;

  if (!newEntries) {
    return hasErrors;
  }

  let hasUpdates = false;

  const existingEntryIdToEdgeMap = (proxy.entries
    .edges as EntryConnectionFragment_edges[]).reduce((acc, e) => {
    const entryEdge = e as EntryConnectionFragment_edges;
    acc[(entryEdge.node as EntryFragment).id] = entryEdge;
    return acc;
  }, {} as { [k: string]: EntryConnectionFragment_edges });

  const entriesEdgesToBeAdded: EntryConnectionFragment_edges[] = [];

  newEntries.forEach(maybeNew => {
    if (maybeNew.__typename === "CreateEntrySuccess") {
      const { entry } = maybeNew;
      const entryEdge = entryToEdge(entry);
      const clientId = entry.clientId as string;

      if (existingEntryIdToEdgeMap[clientId]) {
        // offline entry synced`
        existingEntryIdToEdgeMap[clientId] = entryEdge;
      } else {
        entriesEdgesToBeAdded.push(entryEdge);
      }

      hasUpdates = true;
    } else {
      hasErrors = true;
    }
  });

  if (hasUpdates) {
    proxy.entries.edges = entriesEdgesToBeAdded
      .reverse()
      .concat(Object.values(existingEntryIdToEdgeMap));
  }

  return hasErrors;
}

function updateUnsynced(
  experienceId: string,
  hasOwnFieldsErrors: boolean,
  hasNewEntriesErrors: boolean,
  hasDefinitionsErrors: boolean,
  definitionIds: string[],
  hasUpdatedEntriesErrors: boolean,
  updatedEntriesIdsToDelete: UpdatedEntriesIdsToDelete,
) {
  const unsynced = getUnsyncedExperience(experienceId);

  if (!unsynced) {
    return;
  }

  if (!hasOwnFieldsErrors) {
    delete unsynced.ownFields;
  }

  if (!hasNewEntriesErrors) {
    delete unsynced.newEntries;
  }

  const unsyncedDefinitions = unsynced.definitions;

  if (unsyncedDefinitions) {
    if (!hasDefinitionsErrors) {
      delete unsynced.definitions;
    } else {
      definitionIds.forEach(id => {
        delete unsyncedDefinitions[id];
      });
    }
  }

  const unsyncedModifiedEntries = unsynced.modifiedEntries;

  if (unsyncedModifiedEntries) {
    if (!hasUpdatedEntriesErrors) {
      delete unsynced.modifiedEntries;
    } else {
      updatedEntriesIdsToDelete.forEach(([entryId, dataObjectsIds]) => {
        if (!dataObjectsIds.length) {
          delete unsyncedModifiedEntries[entryId];
        } else {
          const unsyncedModifiedEntry = unsyncedModifiedEntries[entryId];
          dataObjectsIds.forEach(id => {
            delete unsyncedModifiedEntry[id];
          });
        }
      });
    }
  }

  if (!Object.keys(unsynced).length) {
    removeUnsyncedExperience(experienceId);
  } else {
    writeUnsyncedExperience(experienceId, unsynced);
  }
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

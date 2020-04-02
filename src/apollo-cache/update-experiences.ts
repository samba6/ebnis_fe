import { DataProxy } from "apollo-cache";
import immer, { Draft } from "immer";
import { UpdateExperiencesOnlineMutationResult } from "../graphql/experiences.mutation";
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
  }, {} as UpdatedEntries);

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

function updateOwnFields1(
  { ownFields }: UpdateExperienceFragment,
  proxy: DraftState,
): UpdateOwnFieldsResult {
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

function updateDefinitions1(
  { updatedDefinitions: updatedDefinitionResults }: UpdateExperienceFragment,
  proxy: DraftState,
): UpdateDefinitionsResults {
  let hasErrors = false;

  if (!updatedDefinitionResults) {
    return [hasErrors, []];
  }

  const [
    updatedDefinitions,
    definitionIdsForRemoval,
  ] = updatedDefinitionResults.reduce(
    (acc, d) => {
      if (d.__typename === "DefinitionSuccess") {
        const [updates, definitionIdsForRemoval] = acc;

        const { definition: updatedDefinition } = d;
        const { id } = updatedDefinition;
        definitionIdsForRemoval.push(id);
        updates[id] = updatedDefinition;
      } else {
        hasErrors = true;
      }

      return acc;
    },
    [{}, []] as [{ [definitionId: string]: DataDefinitionFragment }, string[]],
  );

  if (definitionIdsForRemoval.length) {
    proxy.dataDefinitions = proxy.dataDefinitions.map(o => {
      const oldDefinition = o as DataDefinitionFragment;
      return updatedDefinitions[oldDefinition.id] || oldDefinition;
    });
  }

  return [hasErrors, definitionIdsForRemoval];
}

function updateEntries1(
  { updatedEntries }: UpdateExperienceFragment,
  proxy: DraftState,
): UpdateEntriesResult {
  let hasErrors = false;

  if (!updatedEntries) {
    return [hasErrors, []];
  }

  let hasUpdates = false;

  const updates = updatedEntries.reduce((acc, e) => {
    if (e.__typename === "UpdateEntrySomeSuccess") {
      const { entryId, dataObjects } = e.entry;
      let thisEntryIsUpdated = false;

      const idToDataObjectMap = dataObjects.reduce((dAcc, d) => {
        if (d.__typename === "DataObjectSuccess") {
          thisEntryIsUpdated = true;
          hasUpdates = true;
          const { dataObject } = d;
          dAcc[dataObject.id] = dataObject;
        } else {
          hasErrors = true;
        }

        return dAcc;
      }, {} as { [dataObjectId: string]: DataObjectFragment });

      if (thisEntryIsUpdated) {
        acc[entryId] = idToDataObjectMap;
      }
    } else {
      hasErrors = true;
    }

    return acc;
  }, {} as { [entryId: string]: { [dataObjectId: string]: DataObjectFragment } });

  const returnValue: [string, string[]][] = [];

  if (hasUpdates) {
    (proxy.entries.edges as EntryConnectionFragment_edges[]).forEach(e => {
      const node = (e as EntryConnectionFragment_edges).node as EntryFragment;
      const { id: entryId } = node;
      const idToUpdatedDataObjectMap = updates[entryId];

      if (idToUpdatedDataObjectMap) {
        const updatedDataObjectIds: string[] = [];
        node.dataObjects = (node.dataObjects as DataObjectFragment[]).map(
          dataObject => {
            const { id } = dataObject;
            updatedDataObjectIds.push(id);
            return idToUpdatedDataObjectMap[id] || dataObject;
          },
        );

        returnValue.push([entryId, updatedDataObjectIds]);
      }
    });
  }

  return [hasErrors, returnValue];
}

function addEntries1(
  { newEntries }: UpdateExperienceFragment,
  proxy: DraftState,
): AddEntriesResult {
  let hasErrors = false;

  if (!newEntries) {
    return hasErrors;
  }

  let hasUpdates = false;

  const clientIdToNewEntryMap = newEntries.reduce((acc, maybeNew) => {
    if (maybeNew.__typename === "CreateEntrySuccess") {
      const { entry } = maybeNew;
      acc[entry.clientId as string] = entry;
      hasUpdates = true;
    } else {
      hasErrors = true;
    }

    return acc;
  }, {} as { [clientId: string]: EntryFragment });

  if (hasUpdates) {
    (proxy.entries.edges as EntryConnectionFragment_edges[]).forEach(e => {
      const edge = e as EntryConnectionFragment_edges;
      const node = edge.node as EntryFragment;
      const newEntry = clientIdToNewEntryMap[node.id];
      if (newEntry) {
        edge.node = newEntry;
      }
    });
  }

  return hasErrors;
}

function getExperiencesAndUpdateData(
  dataProxy: DataProxy,
  result: UpdateExperiencesOnlineMutationResult,
) {
  const updates: ExperienceAndUpdateData[] = [];

  const updateExperiences =
    result && result.data && result.data.updateExperiences;

  if (!updateExperiences) {
    return updates;
  }

  if (updateExperiences.__typename === "UpdateExperiencesAllFail") {
    return updates;
  } else {
    return updateExperiences.experiences.reduce((acc, updateResult) => {
      if (updateResult.__typename === "UpdateExperienceSomeSuccess") {
        const { experience: result } = updateResult;
        const { experienceId, updatedAt } = result;
        const experience = readExperienceFragment(dataProxy, experienceId);

        if (experience) {
          // const updatedExperience =
          immer(experience, proxy => {
            proxy.updatedAt = updatedAt;

            const hasOwnFieldsErrors = updateOwnFields1(result, proxy);

            const [
              hasDefinitionsErrors,
              definitionIdsForRemoval,
            ] = updateDefinitions1(result, proxy);

            const hasNewEntriesErrors = addEntries1(result, proxy);
            const [hasUpdatedEntriesErrors] = updateEntries1(result, proxy);

            const noErrors =
              !hasOwnFieldsErrors &&
              !hasDefinitionsErrors &&
              !hasNewEntriesErrors &&
              !hasUpdatedEntriesErrors;

            if (noErrors) {
              proxy.hasUnsaved = null;
            }
          });
        }
      }
      return acc;
    }, [] as ExperienceAndUpdateData[]);
  }
}

export function updateExperiences(
  dataProxy: DataProxy,
  updateData: ExperienceAndUpdateData[],
) {
  updateData.forEach(([updatedExperience]) => {
    writeExperienceFragmentToCache(dataProxy, updatedExperience);
  });
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

interface UpdatedEntries {
  [entryId: string]: IdToDataObjectMap;
}

type UpdatedEntriesIdsToDelete = [string, string[]][];

type HasError = boolean;

type UpdateEntriesResult = [HasError, [string, string[]][]];

interface IdToDataObjectMap {
  [dataObjectId: string]: DataObjectFragment;
}

type UpdateOwnFieldsResult = HasError;

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
import lodashIsEmpty from "lodash/isEmpty";
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
      const idToUpdatedDataObjectMap = {} as UpdatedDataObjects;
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

type DraftState = Draft<ExperienceFragment>;

interface UpdatedEntries {
  [entryId: string]: UpdatedDataObjects;
}

interface UpdatedDataObjects {
  [dataObjectId: string]: DataObjectFragment;
}

type UpdatedEntriesIdsToDelete = [string, string[]][];

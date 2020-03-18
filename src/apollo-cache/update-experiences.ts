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
    const updatedIds: { [k: string]: number } = {};

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
            const [hasDefinitionsErrors, definitionIds] = updateDefinitions(
              proxy,
              result,
            );

            if (
              !(
                hasDefinitionsErrors ||
                hasNewEntriesErrors ||
                hasOwnFieldsErrors
              )
            ) {
              proxy.hasUnsaved = null;
            }

            updateUnsynced(
              experienceId,
              hasOwnFieldsErrors,
              hasNewEntriesErrors,
              hasDefinitionsErrors,
              definitionIds,
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
    // istanbul ignore next:
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
  }, {} as { [k: string]: DataDefinitionFragment });

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
    const edge = e as EntryConnectionFragment_edges;
    acc[(edge.node as EntryFragment).id] = edge;
    return acc;
  }, {} as { [k: string]: EntryConnectionFragment_edges });

  const entriesToBeAdd: EntryConnectionFragment_edges[] = [];

  newEntries.forEach(maybeNew => {
    if (maybeNew.__typename === "CreateEntrySuccess") {
      const { entry } = maybeNew;
      const edge = entryToEdge(entry);
      const clientId = entry.clientId as string;

      if (existingEntryIdToEdgeMap[clientId]) {
        existingEntryIdToEdgeMap[clientId] = edge;
      } else {
        entriesToBeAdd.push(edge);
      }

      hasUpdates = true;
    } else {
      hasErrors = true;
    }
  });

  if (hasUpdates) {
    proxy.entries.edges = entriesToBeAdd
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

  if (lodashIsEmpty(unsynced)) {
    removeUnsyncedExperience(experienceId);
  } else {
    writeUnsyncedExperience(experienceId, unsynced);
  }
}

type DraftState = Draft<ExperienceFragment>;

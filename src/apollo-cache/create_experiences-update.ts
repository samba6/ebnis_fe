import { DataProxy } from "apollo-cache";
// import immer, { Draft } from "immer";
import { CreateExperiencesMutationResult } from "../graphql/experiences.gql";
import {
  ExperienceFragment,
  ExperienceFragment_entries_edges,
} from "../graphql/apollo-types/ExperienceFragment";
import { readExperienceFragment } from "./read-experience-fragment";
import { writeExperienceFragmentToCache } from "./write-experience-fragment";
import { insertExperiencesInGetExperiencesMiniQuery } from "./update-get-experiences-mini-query";

export function createExperiencesManualUpdate(
  dataProxy: DataProxy,
  result: CreateExperiencesMutationResult,
) {
  const validResponses = result && result.data && result.data.createExperiences;

  if (!validResponses) {
    return;
  }

  const toBeInserted = validResponses.reduce((acc, response) => {
    if (!response) {
      return acc;
    }

    if (response.__typename === "ExperienceSuccess") {
      const { experience, entriesErrors } = response;

      if (!entriesErrors) {
        acc.push(experience);
        return acc;
      }

      const cachedExperience = readExperienceFragment(dataProxy, experience.id);

      // fresh experience created directly online
      if (!cachedExperience) {
        acc.push(experience);
        return acc;
      }

      // experience created offline now synced

      const unsyncedEdges = cachedExperience.entries.edges;

      if (!unsyncedEdges) {
        acc.push(experience);
        return acc;
      }

      const errorsIndices = entriesErrors.reduce((acc, e) => {
        const {
          meta: { index },
        } = e;
        if ("number" === typeof index) {
          acc.push(index);
        }

        return acc;
      }, [] as number[]);

      const syncedAndUnsyncedEntries: ExperienceFragment_entries_edges[] = Array.from(
        {
          length: unsyncedEdges.length,
        },
      );

      const syncedEdges = [
        ...(experience.entries.edges || []),
      ] as ExperienceFragment_entries_edges[];

      let syncedIndex = 0;

      unsyncedEdges.forEach((e, index) => {
        const edge = e as ExperienceFragment_entries_edges;

        if (errorsIndices.includes(index)) {
          syncedAndUnsyncedEntries[index] = edge;
        } else {
          syncedAndUnsyncedEntries[index] = syncedEdges[syncedIndex++];
        }
      });

      const updatedEntries = {
        ...experience.entries,
        edges: syncedAndUnsyncedEntries,
      };

      const updatedExperience = { ...experience, entries: updatedEntries };
      acc.push(updatedExperience);
      writeExperienceFragmentToCache(dataProxy, updatedExperience);
    }

    return acc;
  }, [] as ExperienceFragment[]);

  if (toBeInserted.length) {
    insertExperiencesInGetExperiencesMiniQuery(dataProxy, toBeInserted);
  }
}

import immer from "immer";

import { CreateEntryMutation } from "../../graphql/apollo-types/CreateEntryMutation";
import {
  ExperienceFragment,
  ExperienceFragment_entries,
  ExperienceFragment_entries_edges_node,
} from "../../graphql/apollo-types/ExperienceFragment";
import { writeGetExperienceFullQueryToCache } from "../../state/resolvers/write-get-experience-full-query-to-cache";
import { DataProxy } from "apollo-cache";
import { FetchResult } from "apollo-link";
import { readGetExperienceFullQueryFromCache } from "../../state/resolvers/read-get-experience-full-query-from-cache";
import { entryToEdge } from "../../state/resolvers/entry-to-edge";

type Fn<T = string | ExperienceFragment> = (
  arg: T,
) => (
  proxy: DataProxy,
  mutationResult: FetchResult<CreateEntryMutation>,
) => T extends ExperienceFragment
  ? Promise<ExperienceFragment>
  : Promise<ExperienceFragment | undefined>;

/**
 * Insert the entry into the experience and updates the Get full experience
 * query
 */
export const updateExperienceWithNewEntry: Fn = function updateFn(
  experienceOrId,
) {
  return async function updateFnInner(dataProxy, { data: newEntryEntry }) {
    const entry = newEntryEntry && newEntryEntry.createEntry;
    let experience = experienceOrId as (ExperienceFragment | null);

    if (typeof experienceOrId === "string") {
      if (!entry) {
        return;
      }

      experience = readGetExperienceFullQueryFromCache(
        dataProxy,
        experienceOrId,
      );

      if (!experience) {
        return;
      }
    }

    const updatedExperience = immer(experience as ExperienceFragment, proxy => {
      const entries = proxy.entries as ExperienceFragment_entries;
      const edges = entries.edges || [];

      edges.push(entryToEdge(entry as ExperienceFragment_entries_edges_node));

      entries.edges = edges;
      proxy.entries = entries;
    });

    // PLEASE I NEED TO CHECK THIS AGAIN AS WE ARE ALREADY WRITING THE FULL
    // EXPERIENCE FRAGMENT IN my-experiences/pre-fetch-experiences.
    // if we don't re-write the experience fragment we will only be able to
    // query EXPERIENCE_MINI_FRAGMENT and not EXPERIENCE_FRAGMENT.
    writeGetExperienceFullQueryToCache(dataProxy, updatedExperience, {
      writeFragment: true,
    });

    return updatedExperience;
  };
};

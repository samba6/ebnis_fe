import {
  ExperienceFragment,
  ExperienceFragment_entries_edges_node,
  ExperienceFragment_entries_edges,
} from "../../graphql/apollo-types/ExperienceFragment";
import { SavedAndUnsavedExperiences } from "../../state/unsaved-resolvers";
import { writeSavedAndUnsavedExperiencesToCache } from "../../state/resolvers/update-saved-and-unsaved-experiences-in-cache";
import immer from "immer";
import { entryToEdge } from "../../state/resolvers/entry-to-edge";
import { writeExperienceFragmentToCache } from "../../state/resolvers/write-experience-fragment-to-cache";
import { ExperiencesIdsToObjectMap } from "./utils";
import { deleteIdsFromCache } from "../../state/resolvers/delete-ids-from-cache";
import { writeGetExperienceFullQueryToCache } from "../../state/resolvers/write-get-experience-full-query-to-cache";
import { replaceExperiencesInGetExperiencesMiniQuery } from "../../state/resolvers/update-get-experiences-mini-query";
import { InMemoryCache } from "apollo-cache-inmemory";
import ApolloClient from "apollo-client";

export function updateCache({
  unsavedExperiencesMap,
  savedExperiencesMap,
  cache,
  client,
}: Args) {
  const savedAndUnsavedExperiences: SavedAndUnsavedExperiences[] = [];
  const unsavedVersionOfSavedExperienceIds: string[] = [];
  const unsavedVersionOfSavedEntryIds: string[] = [];
  let outstandingUnsavedCount = 0;

  // PLEASE DO ALL DELETES BEFORE UNSAVED EXPERIENCES NOW SAVED WRITES !!!!!!
  // This is because if now saved experience contains unsaved entries, those
  // will be deleted if write occurs before delete. But if write happens after
  // delete, we are guaranteed to rewrite those unsaved entries back when we
  // write the newly saved experience.
  const unsavedExperiencesNowSaved: ExperienceFragment[] = [];
  const unsavedExperiencesToBeReplacedMap: {
    [k: string]: ExperienceFragment;
  } = {};

  Object.entries(unsavedExperiencesMap).forEach(([unsavedId, map]) => {
    const { newlySavedExperience, unsavedEntries, entriesErrors } = map;

    if (!newlySavedExperience) {
      outstandingUnsavedCount += 1 + unsavedEntries.length;
      return;
    }

    unsavedVersionOfSavedExperienceIds.push(unsavedId);

    const updatedExperience = immer(newlySavedExperience, proxy => {
      const entries = proxy.entries;
      const edges = entries.edges as ExperienceFragment_entries_edges[];

      for (const edge of edges) {
        // this is a newly saved entry - the unsaved version will be deleted
        // from cache
        const entry = edge.node as ExperienceFragment_entries_edges_node;
        const clientId = entry.clientId as string;

        // we will delete the unsaved version from cache.
        unsavedVersionOfSavedEntryIds.push(clientId);
      }

      // The experience from server will only have saved entries -
      // add outstanding unsaved entries if any
      if (entriesErrors) {
        const entriesErrorsIds = Object.keys(entriesErrors);
        const errorsLen = entriesErrorsIds.length;

        outstandingUnsavedCount += errorsLen;

        // we now replace unsaved version with saved version
        savedAndUnsavedExperiences.push({
          id: newlySavedExperience.id,
          unsavedEntriesCount: errorsLen,
          __typename: "SavedAndUnsavedExperiences",
        });

        // we merge unsaved entries into saved entries received from server.
        unsavedEntries.forEach(entry => {
          if (entriesErrorsIds.includes(entry.id)) {
            edges.push(entryToEdge(entry));
          }
        });
      }

      entries.edges = edges;
      proxy.entries = entries;
    });

    unsavedExperiencesNowSaved.push(updatedExperience);
    unsavedExperiencesToBeReplacedMap[unsavedId] = updatedExperience;
  });

  Object.entries(savedExperiencesMap).forEach(([experienceId, map]) => {
    const {
      newlySavedEntries,
      experience,
      entriesErrors,
      unsavedEntries,
    } = map;

    if (!newlySavedEntries || newlySavedEntries.length === 0) {
      outstandingUnsavedCount += unsavedEntries.length;
      return;
    }

    const updatedExperience = immer(experience, proxy => {
      const entries = proxy.entries;
      const edges = entries.edges as ExperienceFragment_entries_edges[];

      const newlySavedEntriesMap = newlySavedEntries.reduce(
        (acc, entry) => {
          const clientId = entry.clientId as string;
          acc[clientId] = entry;

          // we will delete unsaved entries now saved from cache
          unsavedVersionOfSavedEntryIds.push(clientId);

          return acc;
        },
        {} as {
          [k: string]: ExperienceFragment_entries_edges_node;
        },
      );

      swapUnsavedEntriesWithNewlySaved(edges, newlySavedEntriesMap);

      entries.edges = edges;
      proxy.entries = entries;
    });

    if (entriesErrors) {
      const errorsLen = Object.keys(entriesErrors).length;

      outstandingUnsavedCount += errorsLen;

      savedAndUnsavedExperiences.push({
        id: experienceId,
        unsavedEntriesCount: errorsLen,
        __typename: "SavedAndUnsavedExperiences",
      });
    }

    writeExperienceFragmentToCache(cache, updatedExperience);
  });

  const toDelete = unsavedVersionOfSavedExperienceIds.concat(
    unsavedVersionOfSavedEntryIds,
  );

  if (unsavedExperiencesNowSaved.length !== 0) {
    // replacement must run before delete because after delete, apollo will
    // return an empty object ({}) for the deleted experience.
    replaceExperiencesInGetExperiencesMiniQuery(
      client,
      unsavedExperiencesToBeReplacedMap,
    );
  }

  // we need to do all deletes before writing anything to do with unsaved
  // experiences now saved.
  if (toDelete.length !== 0) {
    deleteIdsFromCache(cache, toDelete);
  }

  // Now if we have unsaved entries, we are sure they will be re-created if
  // we accidentally delete above.
  unsavedExperiencesNowSaved.forEach(updatedExperience => {
    // notice we are not writing the fragment for newly saved experience like
    // we did with for existing saved experience
    // this is because the `GetExperienceFullQuery` already exists for those
    // and we now need to write the query for newly saved experience so that
    // when we visit e.g. 'experience page', we don't hit the network again.
    // and of course apollo had already written the fragment for us when
    // we received response from server.

    // can I remove this part? Apollo should have generated this query for me
    // when I received result from network
    writeGetExperienceFullQueryToCache(cache, updatedExperience, {
      writeFragment: false,
    });
  });

  if (savedAndUnsavedExperiences.length !== 0) {
    writeSavedAndUnsavedExperiencesToCache(cache, savedAndUnsavedExperiences);
  }

  return outstandingUnsavedCount;
}

function swapUnsavedEntriesWithNewlySaved(
  edges: ExperienceFragment_entries_edges[],
  newlySavedEntriesMap: {
    [k: string]: ExperienceFragment_entries_edges_node;
  },
) {
  for (const edge of edges) {
    const entry = edge.node as ExperienceFragment_entries_edges_node;

    const mayBeNewlySavedEntryNode =
      newlySavedEntriesMap[entry.clientId as string];

    if (mayBeNewlySavedEntryNode) {
      // swap
      edge.node = mayBeNewlySavedEntryNode;
    }
  }
}

export interface SavedStatuses {
  [k: string]: SavedStatus;
}

export interface SavedStatus {
  savedExperience: ExperienceFragment;
  unsavedEntries: ExperienceFragment_entries_edges_node[];
  clientIdsOfEntriesWithErrors: string[];
  isUnsavedExperience: boolean;
  savedExperienceSavedEntries?: ExperienceFragment_entries_edges_node[];
}

interface Args {
  unsavedExperiencesMap: ExperiencesIdsToObjectMap;
  savedExperiencesMap: ExperiencesIdsToObjectMap;
  cache: InMemoryCache;
  client: ApolloClient<{}>;
}

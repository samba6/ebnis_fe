import {
  ExperienceFragment,
  ExperienceFragment_entries_edges_node,
  ExperienceFragment_entries_edges,
  ExperienceFragment_dataDefinitions,
} from "../../graphql/apollo-types/ExperienceFragment";
import {
  SavedAndUnsavedExperiences,
  SAVED_AND_UNSAVED_EXPERIENCE_TYPENAME,
} from "../../state/unsaved-resolvers";
import { writeSavedAndUnsavedExperiencesToCache } from "../../state/resolvers/update-saved-and-unsaved-experiences-in-cache";
import immer from "immer";
import { entryToEdge } from "../../state/resolvers/entry-to-edge";
import { ExperiencesIdsToObjectMap } from "./upload-unsaved.utils";
import { deleteIdsFromCache } from "../../state/resolvers/delete-references-from-cache";
import { writeGetExperienceFullQueryToCache } from "../../state/resolvers/write-get-experience-full-query-to-cache";
import { replaceExperiencesInGetExperiencesMiniQuery } from "../../state/resolvers/update-get-experiences-mini-query";
import { InMemoryCache } from "apollo-cache-inmemory";
import ApolloClient from "apollo-client";
import {
  MUTATION_NAME_createUnsavedExperience,
  MUTATION_NAME_createUnsavedEntry,
  QUERY_NAME_getExperience,
} from "../../state/resolvers";
import { DataObjectFragment } from "../../graphql/apollo-types/DataObjectFragment";
import { EntryFragment } from "../../graphql/apollo-types/EntryFragment";

export function updateCache({
  neverSavedMap,
  partlySavedMap,
  cache,
  client,
}: Args) {
  const unsavedExperiences = handleUnsavedExperiences(neverSavedMap);

  const savedExperiences = handleSavedExperiences(partlySavedMap);

  // PLEASE DO ALL DELETES BEFORE UNSAVED EXPERIENCES NOW SAVED WRITES !!!!!!
  // This is because if now saved experience contains unsaved entries, those
  // will be deleted if write occurs before delete. But if write happens after
  // delete, we are guaranteed to rewrite those unsaved entries back when we
  // write the newly saved experience.
  const unsavedExperiencesNowSaved = unsavedExperiences.unsavedExperiencesNowSaved.concat(
    savedExperiences.unsavedExperiencesNowSaved,
  );

  const nowSaved = unsavedExperiences.unsavedExperiencesNowSaved.reduce(
    (acc, e) => {
      acc[e.clientId as string] = e;
      return acc;
    },
    {},
  );

  if (unsavedExperiencesNowSaved.length !== 0) {
    // replacement must run before delete because after delete, apollo will
    // return an empty object ({}) for the deleted experience.
    replaceExperiencesInGetExperiencesMiniQuery(
      client,
      savedExperiences.unsavedExperiencesNowSaved.reduce((acc, e) => {
        acc[e.id] = e;
        return acc;
      }, nowSaved),
    );
  }

  const toDeletes = unsavedExperiences.toDeletes.concat(
    savedExperiences.toDeletes,
  );

  if (toDeletes.length !== 0) {
    // we need to do all deletes before writing.
    deleteIdsFromCache(cache, toDeletes, {
      mutations: unsavedExperiences.mutations.concat(
        savedExperiences.mutations,
      ),
      queries: unsavedExperiences.queries,
    });
  }

  const savedAndUnsavedExperiences = unsavedExperiences.savedAndUnsavedExperiences.concat(
    savedExperiences.savedAndUnsavedExperiences,
  );

  if (savedAndUnsavedExperiences.length !== 0 || toDeletes.length !== 0) {
    writeSavedAndUnsavedExperiencesToCache(cache, savedAndUnsavedExperiences);
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

  return (
    unsavedExperiences.outstandingUnsavedCount +
    savedExperiences.outstandingUnsavedCount
  );
}

function handleUnsavedExperiences(
  unsavedExperiencesMap: ExperiencesIdsToObjectMap,
) {
  const savedAndUnsavedExperiences: SavedAndUnsavedExperiences[] = [];
  let outstandingUnsavedCount = 0;
  let toDeletes: string[] = [];
  const mutations: [string, string][] = [];
  const queries: [string, string][] = [];
  const unsavedExperiencesNowSaved: ExperienceFragment[] = [];

  Object.entries(unsavedExperiencesMap).forEach(([unsavedId, map]) => {
    const {
      newlySavedExperience,
      unsavedEntries,
      entriesErrors,
      experience,
    } = map;

    if (!newlySavedExperience) {
      const errorsLen = unsavedEntries.length;
      outstandingUnsavedCount += 1 + errorsLen;

      savedAndUnsavedExperiences.push({
        id: experience.id,
        unsavedEntriesCount: errorsLen,
        __typename: SAVED_AND_UNSAVED_EXPERIENCE_TYPENAME,
      });

      return;
    }

    const cacheKey = `Experience:${unsavedId}`;

    toDeletes.push(cacheKey);

    (experience.dataDefinitions as ExperienceFragment_dataDefinitions[]).forEach(
      f => toDeletes.push(`DataDefinition:${f.id}`),
    );

    mutations.push([MUTATION_NAME_createUnsavedExperience, cacheKey]);
    queries.push([QUERY_NAME_getExperience, cacheKey]);

    const updatedExperience = immer(newlySavedExperience, proxy => {
      const entries = proxy.entries;
      const edges = entries.edges as ExperienceFragment_entries_edges[];

      for (const edge of edges) {
        // this is a newly saved entry - the unsaved version will be deleted
        // from cache
        const entry = edge.node as ExperienceFragment_entries_edges_node;
        const clientId = entry.clientId as string;

        // we will delete the unsaved version from cache.
        toDeletes.push(`Entry:${clientId}`);
        mutations.push([MUTATION_NAME_createUnsavedEntry, `Entry:${clientId}`]);

        deleteDataObjectsFromEntry(entry, toDeletes);
      }

      // The experience from server will only have saved entries -
      // add outstanding unsaved entries if any
      if (entriesErrors) {
        proxy.hasUnsaved = true;
        const entriesErrorsIds = Object.keys(entriesErrors);
        const errorsLen = entriesErrorsIds.length;

        outstandingUnsavedCount += errorsLen;

        // we now replace unsaved experience version with saved version
        savedAndUnsavedExperiences.push({
          id: newlySavedExperience.id,
          unsavedEntriesCount: errorsLen,
          __typename: SAVED_AND_UNSAVED_EXPERIENCE_TYPENAME,
        });

        // we merge unsaved entries into saved entries received from server.
        unsavedEntries.forEach(entry => {
          // it is unsaved so id === clientId
          const { id } = entry;

          if (entriesErrorsIds.includes(id)) {
            edges.push(entryToEdge(entry));

            mutations.push([MUTATION_NAME_createUnsavedEntry, `Entry:${id}`]);
          }
        });
      } else {
        toDeletes.push(`${SAVED_AND_UNSAVED_EXPERIENCE_TYPENAME}:${unsavedId}`);
      }

      entries.edges = edges;
      proxy.entries = entries;
    });

    unsavedExperiencesNowSaved.push(updatedExperience);
  });

  return {
    savedAndUnsavedExperiences,
    outstandingUnsavedCount,
    toDeletes,
    mutations,
    unsavedExperiencesNowSaved,
    queries,
  };
}

function handleSavedExperiences(
  savedExperiencesMap: ExperiencesIdsToObjectMap,
) {
  const savedAndUnsavedExperiences: SavedAndUnsavedExperiences[] = [];
  let outstandingUnsavedCount = 0;
  let toDeletes: string[] = [];
  const mutations: [string, string][] = [];
  const unsavedExperiencesNowSaved: ExperienceFragment[] = [];

  Object.entries(savedExperiencesMap).forEach(([experienceId, map]) => {
    const {
      newlySavedEntries,
      experience,
      entriesErrors,
      unsavedEntries,
    } = map;

    if (!newlySavedEntries || newlySavedEntries.length === 0) {
      const errorsLen = unsavedEntries.length;
      outstandingUnsavedCount += errorsLen;

      savedAndUnsavedExperiences.push({
        id: experience.id,
        unsavedEntriesCount: errorsLen,
        __typename: SAVED_AND_UNSAVED_EXPERIENCE_TYPENAME,
      });

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
          toDeletes.push(`Entry:${clientId}`);
          deleteDataObjectsFromEntry(entry, toDeletes);

          mutations.push([
            MUTATION_NAME_createUnsavedEntry,
            `Entry:${clientId}`,
          ]);

          return acc;
        },
        {} as {
          [k: string]: ExperienceFragment_entries_edges_node;
        },
      );

      entries.edges = swapUnsavedEntriesWithNewlySaved(
        edges,
        newlySavedEntriesMap,
      );
      proxy.entries = entries;

      if (!entriesErrors) {
        proxy.hasUnsaved = null;
      }
    });

    if (entriesErrors) {
      const errorsLen = Object.keys(entriesErrors).length;

      outstandingUnsavedCount += errorsLen;

      savedAndUnsavedExperiences.push({
        id: experienceId,
        unsavedEntriesCount: errorsLen,
        __typename: SAVED_AND_UNSAVED_EXPERIENCE_TYPENAME,
      });
    } else {
      toDeletes.push(
        `${SAVED_AND_UNSAVED_EXPERIENCE_TYPENAME}:${experienceId}`,
      );
    }
    unsavedExperiencesNowSaved.push(updatedExperience);
  });

  return {
    savedAndUnsavedExperiences,
    outstandingUnsavedCount,
    toDeletes,
    mutations,
    unsavedExperiencesNowSaved,
  };
}

function swapUnsavedEntriesWithNewlySaved(
  edges: ExperienceFragment_entries_edges[],
  newlySavedEntriesMap: {
    [k: string]: ExperienceFragment_entries_edges_node;
  },
) {
  return edges.map(edge => {
    const entry = edge.node as ExperienceFragment_entries_edges_node;

    const mayBeNewlySavedEntryNode =
      newlySavedEntriesMap[entry.clientId as string];

    if (mayBeNewlySavedEntryNode) {
      // swap
      edge.node = mayBeNewlySavedEntryNode;
    }

    return edge;
  });
}

function deleteDataObjectsFromEntry(entry: EntryFragment, toDeletes: string[]) {
  entry.dataObjects.forEach(obj => {
    const clientId = (obj as DataObjectFragment).clientId as string;
    toDeletes.push(`DataObject:${clientId}`);
  });
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

export interface Args {
  neverSavedMap: ExperiencesIdsToObjectMap;
  partlySavedMap: ExperiencesIdsToObjectMap;
  cache: InMemoryCache;
  client: ApolloClient<{}>;
}

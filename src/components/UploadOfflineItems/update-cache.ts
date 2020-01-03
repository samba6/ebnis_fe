import {
  ExperienceFragment,
  ExperienceFragment_entries_edges_node,
  ExperienceFragment_entries_edges,
  ExperienceFragment_dataDefinitions,
} from "../../graphql/apollo-types/ExperienceFragment";
import {
  OfflineItem,
  OFFLINE_ITEMS_TYPENAME,
} from "../../state/offline-resolvers";
import { writeOfflineItemsToCache } from "../../apollo-cache/write-offline-items-to-cache";
import immer from "immer";
import { entryToEdge } from "../../state/resolvers/entry-to-edge";
import { ExperiencesIdsToObjectMap } from "./upload-offline.utils";
import { wipeReferencesFromCache } from "../../state/resolvers/delete-references-from-cache";
import { writeGetExperienceFullQueryToCache } from "../../state/resolvers/write-get-experience-full-query-to-cache";
import { replaceExperiencesInGetExperiencesMiniQuery } from "../../state/resolvers/update-get-experiences-mini-query";
import { InMemoryCache } from "apollo-cache-inmemory";
import ApolloClient from "apollo-client";
import {
  MUTATION_NAME_createExperienceOffline,
  MUTATION_NAME_createOfflineEntry,
  QUERY_NAME_getExperience,
} from "../../state/resolvers";
import { DataObjectFragment } from "../../graphql/apollo-types/DataObjectFragment";
import { EntryFragment } from "../../graphql/apollo-types/EntryFragment";

export function updateCache({
  completelyOfflineMap,
  partialOnlineMap,
  cache,
  client,
}: Args) {
  const offlineExperiences = handleOfflineExperiences(completelyOfflineMap);
  const onlineExperiences = handleOnlineExperiences(partialOnlineMap);

  // PLEASE DO ALL DELETES BEFORE OFFLINE EXPERIENCES NOW ONLINE WRITES !!!!!!
  // This is because if now saved experience contains unsaved entries, those
  // will be deleted if write occurs before delete. But if write happens after
  // delete, we are guaranteed to rewrite those unsaved entries back when we
  // write the newly saved experience.
  const offlineExperiencesNowOnline = offlineExperiences.offlineExperiencesNowOnline.concat(
    onlineExperiences.offlineExperiencesNowOnline,
  );

  const nowOnline = offlineExperiences.offlineExperiencesNowOnline.reduce(
    (acc, e) => {
      acc[e.clientId as string] = e;
      return acc;
    },
    {},
  );

  if (offlineExperiencesNowOnline.length !== 0) {
    // replacement must run before delete because after delete, apollo will
    // return an empty object ({}) for the deleted experience.
    replaceExperiencesInGetExperiencesMiniQuery(
      client,
      onlineExperiences.offlineExperiencesNowOnline.reduce((acc, e) => {
        acc[e.id] = e;
        return acc;
      }, nowOnline),
    );
  }

  const toDeletes = offlineExperiences.toDeletes.concat(
    onlineExperiences.toDeletes,
  );

  if (toDeletes.length !== 0) {
    // we need to do all deletes before writing.
    wipeReferencesFromCache(cache, toDeletes, {
      mutations: offlineExperiences.mutations.concat(
        onlineExperiences.mutations,
      ),
      queries: offlineExperiences.queries,
    });
  }

  const offlineItems = offlineExperiences.offlineItems.concat(
    onlineExperiences.offlineItems,
  );

  if (offlineItems.length !== 0 || toDeletes.length !== 0) {
    writeOfflineItemsToCache(cache, offlineItems);
  }

  // Now if we have unsaved entries, we are sure they will be re-created if
  // we accidentally delete above.
  offlineExperiencesNowOnline.forEach(updatedExperience => {
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
    offlineExperiences.outstandingUnsavedCount +
    onlineExperiences.outstandingUnsavedCount
  );
}

function handleOfflineExperiences(
  oflineExperiencesMap: ExperiencesIdsToObjectMap,
) {
  const offlineItems: OfflineItem[] = [];
  let outstandingUnsavedCount = 0;
  const toDeletes: string[] = [];
  const mutations: [string, string][] = [];
  const queries: [string, string][] = [];
  const offlineExperiencesNowOnline: ExperienceFragment[] = [];

  Object.entries(oflineExperiencesMap).forEach(([unsavedId, map]) => {
    const {
      newlySavedExperience,
      offlineEntries,
      entriesErrors,
      experience,
    } = map;

    if (!newlySavedExperience) {
      const errorsLen = offlineEntries.length;
      outstandingUnsavedCount += 1 + errorsLen;

      offlineItems.push({
        id: experience.id,
        offlineEntriesCount: errorsLen,
        __typename: OFFLINE_ITEMS_TYPENAME,
      });

      return;
    }

    const cacheKey = `Experience:${unsavedId}`;

    toDeletes.push(cacheKey);

    (experience.dataDefinitions as ExperienceFragment_dataDefinitions[]).forEach(
      f => toDeletes.push(`DataDefinition:${f.id}`),
    );

    mutations.push([MUTATION_NAME_createExperienceOffline, cacheKey]);
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
        mutations.push([MUTATION_NAME_createOfflineEntry, `Entry:${clientId}`]);

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
        offlineItems.push({
          id: newlySavedExperience.id,
          offlineEntriesCount: errorsLen,
          __typename: OFFLINE_ITEMS_TYPENAME,
        });

        // we merge unsaved entries into saved entries received from server.
        offlineEntries.forEach(entry => {
          // it is unsaved so id === clientId
          const { id } = entry;

          if (entriesErrorsIds.includes(id)) {
            edges.push(entryToEdge(entry));

            mutations.push([MUTATION_NAME_createOfflineEntry, `Entry:${id}`]);
          }
        });
      } else {
        toDeletes.push(`${OFFLINE_ITEMS_TYPENAME}:${unsavedId}`);
      }

      entries.edges = edges;
      proxy.entries = entries;
    });

    offlineExperiencesNowOnline.push(updatedExperience);
  });

  return {
    offlineItems,
    outstandingUnsavedCount,
    toDeletes,
    mutations,
    offlineExperiencesNowOnline,
    queries,
  };
}

function handleOnlineExperiences(
  onlineExperiencesMap: ExperiencesIdsToObjectMap,
) {
  const offlineItems: OfflineItem[] = [];
  let outstandingUnsavedCount = 0;
  const toDeletes: string[] = [];
  const mutations: [string, string][] = [];
  const offlineExperiencesNowOnline: ExperienceFragment[] = [];

  Object.entries(onlineExperiencesMap).forEach(([experienceId, map]) => {
    const {
      newlyOnlineEntries,
      experience,
      entriesErrors,
      offlineEntries,
    } = map;

    if (!newlyOnlineEntries || newlyOnlineEntries.length === 0) {
      const errorsLen = offlineEntries.length;
      outstandingUnsavedCount += errorsLen;

      offlineItems.push({
        id: experience.id,
        offlineEntriesCount: errorsLen,
        __typename: OFFLINE_ITEMS_TYPENAME,
      });

      return;
    }

    const updatedExperience = immer(experience, proxy => {
      const entries = proxy.entries;
      const edges = entries.edges as ExperienceFragment_entries_edges[];

      const newlySavedEntriesMap = newlyOnlineEntries.reduce(
        (acc, entry) => {
          const clientId = entry.clientId as string;
          acc[clientId] = entry;

          // we will delete unsaved entries now saved from cache
          toDeletes.push(`Entry:${clientId}`);
          deleteDataObjectsFromEntry(entry, toDeletes);

          mutations.push([
            MUTATION_NAME_createOfflineEntry,
            `Entry:${clientId}`,
          ]);

          return acc;
        },
        {} as {
          [k: string]: ExperienceFragment_entries_edges_node;
        },
      );

      entries.edges = swapOfflineEntriesWithNewlyOnline(
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

      offlineItems.push({
        id: experienceId,
        offlineEntriesCount: errorsLen,
        __typename: OFFLINE_ITEMS_TYPENAME,
      });
    } else {
      toDeletes.push(`${OFFLINE_ITEMS_TYPENAME}:${experienceId}`);
    }
    offlineExperiencesNowOnline.push(updatedExperience);
  });

  return {
    offlineItems,
    outstandingUnsavedCount,
    toDeletes,
    mutations,
    offlineExperiencesNowOnline,
  };
}

function swapOfflineEntriesWithNewlyOnline(
  edges: ExperienceFragment_entries_edges[],
  newlyOnlineEntriesMap: {
    [k: string]: ExperienceFragment_entries_edges_node;
  },
) {
  return edges.map(edge => {
    const entry = edge.node as ExperienceFragment_entries_edges_node;

    const mayBeNewlyOnlineEntryNode =
      newlyOnlineEntriesMap[entry.clientId as string];

    if (mayBeNewlyOnlineEntryNode) {
      // swap
      edge.node = mayBeNewlyOnlineEntryNode;
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

export interface OnlineStatues {
  [k: string]: OnlineStatus;
}

export interface OnlineStatus {
  onlineExperience: ExperienceFragment;
  offlineEntries: ExperienceFragment_entries_edges_node[];
  clientIdsOfEntriesWithErrors: string[];
  isOfflineExperience: boolean;
  onlineExperienceOnlineEntries?: ExperienceFragment_entries_edges_node[];
}

export interface Args {
  completelyOfflineMap: ExperiencesIdsToObjectMap;
  partialOnlineMap: ExperiencesIdsToObjectMap;
  cache: InMemoryCache;
  client: ApolloClient<{}>;
}

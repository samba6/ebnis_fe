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
import { updateOfflineItemsLedger } from "../../apollo-cache/write-offline-items-to-cache";
import immer from "immer";
import { entryToEdge } from "../../state/resolvers/entry-to-edge";
import { ExperiencesIdsToObjectMap } from "./upload-offline.utils";
import { wipeReferencesFromCache } from "../../state/resolvers/delete-references-from-cache";
import {
  replaceExperiencesInGetExperiencesMiniQuery,
  // insertExperienceInGetExperiencesMiniQuery,
} from "../../state/resolvers/update-get-experiences-mini-query";
import { InMemoryCache } from "apollo-cache-inmemory";
import ApolloClient from "apollo-client";
import {
  MUTATION_NAME_createExperienceOffline,
  MUTATION_NAME_createOfflineEntry,
  QUERY_NAME_getExperience,
} from "../../state/resolvers";
import { DataObjectFragment } from "../../graphql/apollo-types/DataObjectFragment";
import { EntryFragment } from "../../graphql/apollo-types/EntryFragment";
// import { writeExperienceFragmentToCache } from "../../state/resolvers/write-experience-fragment-to-cache";

export function updateCache({
  completelyOfflineMap,
  partialOnlineMap,
  cache,
  client,
}: Args) {
  const offlineExperiences = handleOfflineExperiences(completelyOfflineMap);
  const partOnlineExperiences = handlePartOfflineExperiences(partialOnlineMap);

  console.log(
    `\n\t\tLogging start\n\n\n\n label\n`,
    offlineExperiences,
    partOnlineExperiences,
    `\n\n\n\n\t\tLogging ends\n`,
  );

  const offlineIdToOnlineExperienceMap = offlineExperiences.offlineExperiencesNowOnline.reduce(
    (acc, e) => {
      acc[e.clientId as string] = e;
      return acc;
    },
    {} as { [k: string]: ExperienceFragment },
  );

  if (offlineExperiences.offlineExperiencesNowOnline.length !== 0) {
    replaceExperiencesInGetExperiencesMiniQuery(
      client,
      partOnlineExperiences.partOfflineExperiencesWithNewOnlineEntries.reduce(
        (acc, e) => {
          acc[e.id] = e;
          return acc;
        },
        offlineIdToOnlineExperienceMap,
      ),
    );
  }

  const remainingOfflineItems = offlineExperiences.remainingOfflineItems.concat(
    partOnlineExperiences.remainingOfflineItems,
  );

  if (remainingOfflineItems.length !== 0) {
    updateOfflineItemsLedger(cache, remainingOfflineItems);
  }

  const allOnlineExperiences = offlineExperiences.offlineExperiencesNowOnline.concat(
    partOnlineExperiences.partOfflineExperiencesWithNewOnlineEntries,
  );

  const toDeletes = offlineExperiences.toDeletes.concat(
    partOnlineExperiences.toDeletes,
  );

  wipeReferencesFromCache(cache, toDeletes, {
    mutations: offlineExperiences.mutations.concat(
      partOnlineExperiences.mutations,
    ),
    queries: offlineExperiences.queries,
  });

  return (
    offlineExperiences.remainingOfflineItemsCount +
    partOnlineExperiences.remainingOfflineItemsCount
  );
}

function handleOfflineExperiences(
  oflineExperiencesMap: ExperiencesIdsToObjectMap,
) {
  const remainingOfflineItems: OfflineItem[] = [];
  let remainingOfflineItemsCount = 0;
  const toDeletes: string[] = [];
  const mutations: [string, string][] = [];
  const queries: [string, string][] = [];
  const offlineExperiencesNowOnline: ExperienceFragment[] = [];

  Object.entries(oflineExperiencesMap).forEach(([offlineId, map]) => {
    const {
      newlySavedExperience: newOnlineExperience,
      offlineEntries,
      entriesErrors,
      experience: offlineExperience,
    } = map;

    if (!newOnlineExperience) {
      const errorsLen = offlineEntries.length;
      remainingOfflineItemsCount += 1 + errorsLen;

      remainingOfflineItems.push({
        id: offlineExperience.id,
        offlineEntriesCount: errorsLen,
        __typename: OFFLINE_ITEMS_TYPENAME,
      });

      return;
    }

    // this offline experience now online, so we mark it for deletion, including
    // its data definitions and entries that are now online - we exclude entries
    // that are still offline
    const cacheKey = `Experience:${offlineId}`;
    toDeletes.push(cacheKey);

    (offlineExperience.dataDefinitions as ExperienceFragment_dataDefinitions[]).forEach(
      offlineDataDefinition =>
        toDeletes.push(`DataDefinition:${offlineDataDefinition.id}`),
    );

    mutations.push([MUTATION_NAME_createExperienceOffline, cacheKey]);
    queries.push([QUERY_NAME_getExperience, cacheKey]);

    //
    const updatedExperience = immer(newOnlineExperience, proxy => {
      const entries = proxy.entries;
      const edges = entries.edges as ExperienceFragment_entries_edges[];

      for (const edge of edges) {
        // this is a newly online entry - the offlin version will be deleted
        // from cache
        const entry = edge.node as ExperienceFragment_entries_edges_node;
        const clientId = entry.clientId as string;

        // we will delete the offline version from cache.
        toDeletes.push(`Entry:${clientId}`);
        mutations.push([MUTATION_NAME_createOfflineEntry, `Entry:${clientId}`]);
        deleteDataObjectsFromEntry(entry, toDeletes);
      }

      // The online experience would have contained the online entries -
      // add offline entries not lucky to make it online, if any.
      if (entriesErrors) {
        // means some entries did not make it online
        proxy.hasUnsaved = true;
        const entriesErrorsIds = Object.keys(entriesErrors);
        const offlineEntriesCount = entriesErrorsIds.length;
        remainingOfflineItemsCount += offlineEntriesCount;

        // we document the fact this experience, even though now online still
        // contains offline entries
        remainingOfflineItems.push({
          id: newOnlineExperience.id,
          offlineEntriesCount: offlineEntriesCount,
          __typename: OFFLINE_ITEMS_TYPENAME,
        });

        // the server returned this experience with online entries, so add
        // remaining offline entries back into this online experience as the
        // offline experience version will be deleted which delete all offline
        // entries
        offlineEntries.forEach(entry => {
          // it is offline so id === clientId
          const { id } = entry;

          if (entriesErrorsIds.includes(id)) {
            edges.push(entryToEdge(entry));

            mutations.push([MUTATION_NAME_createOfflineEntry, `Entry:${id}`]);
          }
        });
      } else {
        // no entries errors === everything for this experience now online so
        // we purge from offline items ledger
        toDeletes.push(`${OFFLINE_ITEMS_TYPENAME}:${offlineId}`);
      }

      entries.edges = edges;
      proxy.entries = entries;
    });

    offlineExperiencesNowOnline.push(updatedExperience);
  });

  return {
    remainingOfflineItems,
    remainingOfflineItemsCount,
    toDeletes,
    mutations,
    offlineExperiencesNowOnline,
    queries,
  };
}

function handlePartOfflineExperiences(
  onlineExperiencesMap: ExperiencesIdsToObjectMap,
) {
  const remainingOfflineItems: OfflineItem[] = [];
  let remainingOfflineItemsCount = 0;
  const toDeletes: string[] = [];
  const mutations: [string, string][] = [];
  const partOfflineExperiencesWithNewOnlineEntries: ExperienceFragment[] = [];

  Object.entries(onlineExperiencesMap).forEach(([experienceId, map]) => {
    const {
      newlyOnlineEntries: newOnlineEntries,
      experience,
      entriesErrors,
      offlineEntries,
    } = map;

    if (!newOnlineEntries || newOnlineEntries.length === 0) {
      const entriesErrorsLen = offlineEntries.length;
      remainingOfflineItemsCount += entriesErrorsLen;

      remainingOfflineItems.push({
        id: experience.id,
        offlineEntriesCount: entriesErrorsLen,
        __typename: OFFLINE_ITEMS_TYPENAME,
      });

      return;
    }

    const offlineIdToOnlineEntryMap = newOnlineEntries.reduce(
      (acc, entry) => {
        const clientId = entry.clientId as string;
        acc[clientId] = entry;

        // we will delete offline entry now online from cache
        toDeletes.push(`Entry:${clientId}`);
        deleteDataObjectsFromEntry(entry, toDeletes);

        mutations.push([MUTATION_NAME_createOfflineEntry, `Entry:${clientId}`]);

        return acc;
      },
      {} as {
        [k: string]: ExperienceFragment_entries_edges_node;
      },
    );

    const updatedExperience = immer(experience, proxy => {
      const entries = proxy.entries;
      const offlineAndOrOnlineEntries = entries.edges as ExperienceFragment_entries_edges[];

      entries.edges = swapOfflineEntriesWithNewOnline(
        offlineAndOrOnlineEntries,
        offlineIdToOnlineEntryMap,
      );
      proxy.entries = entries;

      if (!entriesErrors) {
        proxy.hasUnsaved = null;
      }
    });

    if (entriesErrors) {
      const errorsLen = Object.keys(entriesErrors).length;

      remainingOfflineItemsCount += errorsLen;

      remainingOfflineItems.push({
        id: experienceId,
        offlineEntriesCount: errorsLen,
        __typename: OFFLINE_ITEMS_TYPENAME,
      });
    } else {
      toDeletes.push(`${OFFLINE_ITEMS_TYPENAME}:${experienceId}`);
    }
    partOfflineExperiencesWithNewOnlineEntries.push(updatedExperience);
  });

  return {
    remainingOfflineItems,
    remainingOfflineItemsCount,
    toDeletes,
    mutations,
    partOfflineExperiencesWithNewOnlineEntries,
  };
}

function swapOfflineEntriesWithNewOnline(
  offlineAndOrOnlineEntries: ExperienceFragment_entries_edges[],
  offlineIdToOnlineEntryMap: {
    [k: string]: ExperienceFragment_entries_edges_node;
  },
) {
  return offlineAndOrOnlineEntries.map(edge => {
    const entry = edge.node as ExperienceFragment_entries_edges_node;

    const mayBeNewOnlineEntry =
      offlineIdToOnlineEntryMap[entry.clientId as string];

    if (mayBeNewOnlineEntry) {
      // swap
      edge.node = mayBeNewOnlineEntry;
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

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
import {
  wipeReferencesFromCache,
  removeQueriesAndMutationsFromCache,
} from "../../state/resolvers/delete-references-from-cache";
import {
  replaceExperiencesInGetExperiencesMiniQuery,
  // insertExperienceInGetExperiencesMiniQuery,
} from "../../state/resolvers/update-get-experiences-mini-query";
import { InMemoryCache } from "apollo-cache-inmemory";
import ApolloClient from "apollo-client";
import {
  MUTATION_NAME_createExperienceOffline,
  MUTATION_NAME_createOfflineEntry,
} from "../../state/resolvers";
import { DataObjectFragment } from "../../graphql/apollo-types/DataObjectFragment";
import { EntryFragment } from "../../graphql/apollo-types/EntryFragment";
import { decrementOfflineEntriesCountForExperiences } from "../../apollo-cache/drecrement-offline-entries-count";
import { QUERY_NAME_getOfflineItems } from "./upload-offline.resolvers";
import { QUERY_NAME_getExperienceFull } from "../../graphql/get-experience-full.query";
import { MUTATION_NAME_createEntries } from "../../graphql/create-entries.mutation";
import { MUTATION_NAME_saveOfflineExperiences } from "../../graphql/upload-offline-items.mutation";
import { writeExperienceFragmentToCache } from "../../state/resolvers/write-experience-fragment-to-cache";
import { makeApolloCacheRef } from "../../constants";

/**
 * TO REMOVE:
 * ROOT_QUERY.getOfflineItems(
 */

export function updateCache({
  completelyOfflineMap,
  partialOnlineMap,
  cache,
  client,
}: Args) {
  const offlineExperiences = handleOfflineExperiences(
    completelyOfflineMap,
    cache,
  );
  const partOnlineExperiences = handlePartOfflineExperiences(
    partialOnlineMap,
    cache,
  );

  if (offlineExperiences.offlineExperiencesNowOnlineCount > 0) {
    const experiencesToBeReplacedMap = offlineExperiences.offlineExperiencesNowOnline.reduce(
      (acc, e) => {
        acc[e.clientId as string] = e;
        return acc;
      },

      {} as {
        [k: string]: ExperienceFragment;
      },
    );

    replaceExperiencesInGetExperiencesMiniQuery(
      client,
      experiencesToBeReplacedMap,
    );
  }

  if (
    offlineExperiences.offlineExperiencesNowOnlineCount +
      partOnlineExperiences.partOfflineExperiencesWithNewOnlineEntriesCount >
    0
  ) {
    decrementOfflineEntriesCountForExperiences(
      cache,
      Object.entries(partOnlineExperiences.idHowManyMap).reduce(
        (acc, [id, howMany]) => {
          acc[id] = howMany;
          return acc;
        },
        offlineExperiences.idHowManyMap,
      ),
    );
  }

  const remainingOfflineItems = offlineExperiences.remainingOfflineItems.concat(
    partOnlineExperiences.remainingOfflineItems,
  );

  if (remainingOfflineItems.length !== 0) {
    updateOfflineItemsLedger(cache, remainingOfflineItems);
  }

  const toDeletes = offlineExperiences.toDeletes.concat(
    partOnlineExperiences.toDeletes,
  );

  wipeReferencesFromCache(cache, toDeletes);

  removeQueriesAndMutationsFromCache(cache, [
    MUTATION_NAME_createOfflineEntry,
    MUTATION_NAME_createExperienceOffline,
    QUERY_NAME_getOfflineItems,
    QUERY_NAME_getExperienceFull + "(",
    MUTATION_NAME_createEntries,
    MUTATION_NAME_saveOfflineExperiences,
  ]);

  return (
    offlineExperiences.remainingOfflineItemsCount +
    partOnlineExperiences.remainingOfflineItemsCount
  );
}

function handleOfflineExperiences(
  oflineExperiencesMap: ExperiencesIdsToObjectMap,
  cache: InMemoryCache,
) {
  const remainingOfflineItems: OfflineItem[] = [];
  let remainingOfflineItemsCount = 0;
  const toDeletes: string[] = [];
  const offlineExperiencesNowOnline: ExperienceFragment[] = [];
  let decrementFromOfflineLedgerCount = 0;
  const idHowManyMap: { [k: string]: number } = {};

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

    // this offline experience is now online, so we mark it for deletion,
    // including
    // its data definitions and entries that are now online - we exclude entries
    // that are still offline
    toDeletes.push(makeApolloCacheRef("Experience", offlineId));

    (offlineExperience.dataDefinitions as ExperienceFragment_dataDefinitions[]).forEach(
      ({ id }) => toDeletes.push(makeApolloCacheRef("DataDefinition", id)),
    );

    //
    const updatedExperience = immer(newOnlineExperience, proxy => {
      const entries = proxy.entries;
      const edges = entries.edges as ExperienceFragment_entries_edges[];
      // these are the formerly offline entries now online so we decrement
      // offline items counter by thier number.
      decrementFromOfflineLedgerCount += edges.length;

      for (const edge of edges) {
        // this is a newly online entry - the offline version will be deleted
        // from cache
        const entry = edge.node as ExperienceFragment_entries_edges_node;
        const clientId = entry.clientId as string;

        // we will delete the offline version from cache.
        toDeletes.push(makeApolloCacheRef("Entry", clientId));
        deleteDataObjectsFromEntry(entry, toDeletes);
      }

      // The online experience would have contained the online entries -
      // add offline entries not lucky to make it online, if any.
      if (entriesErrors) {
        // means some entries did not make it online
        proxy.hasUnsaved = true; // it will be null as returned by server
        const entriesErrorsIds = Object.keys(entriesErrors);
        const offlineEntriesCount = entriesErrorsIds.length;
        remainingOfflineItemsCount += offlineEntriesCount;

        // we document the fact that this experience, even though now online still
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
          }
        });
      } else {
        // no entries errors === everything for this experience now online so
        // we purge from offline items ledger
        decrementFromOfflineLedgerCount += 1;
      }

      entries.edges = edges;
      proxy.entries = entries;
    });

    offlineExperiencesNowOnline.push(updatedExperience);
    idHowManyMap[offlineId] = decrementFromOfflineLedgerCount;
    writeExperienceFragmentToCache(cache, updatedExperience);
  });

  return {
    remainingOfflineItems,
    remainingOfflineItemsCount,
    toDeletes,
    offlineExperiencesNowOnline,
    offlineExperiencesNowOnlineCount: offlineExperiencesNowOnline.length,
    idHowManyMap,
  };
}

function handlePartOfflineExperiences(
  onlineExperiencesMap: ExperiencesIdsToObjectMap,
  cache: InMemoryCache,
) {
  const remainingOfflineItems: OfflineItem[] = [];
  let remainingOfflineItemsCount = 0;
  const toDeletes: string[] = [];
  const idHowManyMap: { [k: string]: number } = {};
  let decrementFromOfflineLedgerCount = 0;
  let partOfflineExperiencesWithNewOnlineEntriesCount = 0;

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

    decrementFromOfflineLedgerCount += newOnlineEntries.length;

    const offlineIdToOnlineEntryMap = newOnlineEntries.reduce(
      (acc, entry) => {
        const clientId = entry.clientId as string;
        acc[clientId] = entry;

        // we will delete offline entry now online from cache
        toDeletes.push(makeApolloCacheRef("Entry", clientId));
        deleteDataObjectsFromEntry(entry, toDeletes);

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

    writeExperienceFragmentToCache(cache, updatedExperience);

    idHowManyMap[experienceId] = decrementFromOfflineLedgerCount;
    ++partOfflineExperiencesWithNewOnlineEntriesCount;
  });

  return {
    remainingOfflineItems,
    remainingOfflineItemsCount,
    toDeletes,
    partOfflineExperiencesWithNewOnlineEntriesCount,
    idHowManyMap,
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
    toDeletes.push(makeApolloCacheRef("DataObject", clientId));
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

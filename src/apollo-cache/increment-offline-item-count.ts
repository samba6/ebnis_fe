import immer from "immer";
import { queryCacheOfflineItems } from "../state/resolvers/get-experiences-from-cache";
import { OFFLINE_ITEMS_TYPENAME } from "../state/offline-resolvers";
import { updateOfflineItemsLedger } from "./write-offline-items-to-cache";
import { InMemoryCache } from "apollo-cache-inmemory";

export function incrementOfflineItemCount(
  cache: InMemoryCache,
  experienceId: string,
) {
  let cacheData = queryCacheOfflineItems(cache);

  if (cacheData.length === 0) {
    cacheData = [newOfflineItem(experienceId)];
  } else {
    cacheData = immer(cacheData, proxy => {
      const experience = proxy.find(e => e.id === experienceId);
      if (experience) {
        ++experience.offlineEntriesCount;
      } else {
        proxy.push(newOfflineItem(experienceId));
      }
    });
  }

  updateOfflineItemsLedger(cache, cacheData);
}

export function newOfflineItem(experienceId: string) {
  return {
    id: experienceId,
    offlineEntriesCount: 1,
    __typename: OFFLINE_ITEMS_TYPENAME,
  };
}

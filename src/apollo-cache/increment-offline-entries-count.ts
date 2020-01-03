import immer from "immer";
import { queryCacheOfflineItems } from "../state/resolvers/get-experiences-from-cache";
import { OFFLINE_ITEMS_TYPENAME } from "../state/offline-resolvers";
import { isOfflineId } from "../constants";
import { writeOfflineItemsToCache } from "./write-offline-items-to-cache";
import { InMemoryCache } from "apollo-cache-inmemory";

export function incrementOfflineEntriesCountForExperience(
  cache: InMemoryCache,
  experienceId: string,
  updateMode: "update" | "noupdate" = "update",
) {
  let cacheData = queryCacheOfflineItems(cache);

  if (cacheData.length === 0) {
    cacheData = [newOfflineExperienceInCache(experienceId)];
  } else {
    cacheData = immer(cacheData, proxy => {
      const experience = proxy.find(e => e.id === experienceId);
      if (experience) {
        if (updateMode === "update") {
          ++experience.offlineEntriesCount;
        }
      } else {
        proxy.push(newOfflineExperienceInCache(experienceId));
      }
    });
  }

  writeOfflineItemsToCache(cache, cacheData);
}

export function newOfflineExperienceInCache(experienceId: string) {
  return {
    id: experienceId,
    offlineEntriesCount: isOfflineId(experienceId) ? 0 : 1,
    __typename: OFFLINE_ITEMS_TYPENAME,
  };
}

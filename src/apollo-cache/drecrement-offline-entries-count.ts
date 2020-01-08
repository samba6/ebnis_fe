import { queryCacheOfflineItems } from "../state/resolvers/get-experiences-from-cache";
import immer from "immer";
import { updateOfflineItemsLedger } from "./write-offline-items-to-cache";
import { wipeReferencesFromCache } from "../state/resolvers/delete-references-from-cache";
import { OFFLINE_ITEMS_TYPENAME } from "../state/offline-resolvers";
import { InMemoryCache } from "apollo-cache-inmemory";
import { makeApolloCacheRef } from "../constants";

export interface DecrementOfflineEntriesCountForExperienceArgs {
  cache: InMemoryCache;
  experienceId: string;
  howMany: number;
}

export function decrementOfflineEntriesCountForExperience({
  cache,
  experienceId,
  howMany,
}: DecrementOfflineEntriesCountForExperienceArgs) {
  let cacheData = queryCacheOfflineItems(cache);

  if (cacheData.length === 0) {
    return;
  }

  let updated = false;
  let wipeFromCacheId = "";

  cacheData = immer(cacheData, proxy => {
    let index = 0;
    const len = proxy.length;

    for (; index < len; index++) {
      const experience = proxy[index];
      const { id } = experience;
      let { offlineEntriesCount } = experience;

      if (id === experienceId) {
        updated = true;
        offlineEntriesCount -= howMany;

        if (offlineEntriesCount > 0) {
          experience.offlineEntriesCount = offlineEntriesCount;
          proxy[index] = experience;
        } else {
          wipeFromCacheId = id;
          proxy.splice(index, 1);
        }

        break;
      }
    }
  });

  if (wipeFromCacheId) {
    wipeReferencesFromCache(cache, [
      makeApolloCacheRef(OFFLINE_ITEMS_TYPENAME, wipeFromCacheId),
    ]);
  }

  if (updated) {
    updateOfflineItemsLedger(cache, cacheData);
  }
}

export function decrementOfflineEntriesCountForExperiences(
  cache: InMemoryCache,
  idHowManyMap: { [k: string]: number },
) {
  let cacheData = queryCacheOfflineItems(cache);

  if (cacheData.length === 0) {
    return;
  }

  let updated = false;
  let wipeFromCacheId = "";

  cacheData = immer(cacheData, proxy => {
    let index = 0;
    const len = proxy.length;

    for (; index < len; index++) {
      const experience = proxy[index];
      const { id } = experience;
      const howMany = idHowManyMap[id];

      if (howMany === undefined) {
        return;
      }

      let { offlineEntriesCount } = experience;
      updated = true;
      offlineEntriesCount -= howMany;

      if (offlineEntriesCount > 0) {
        experience.offlineEntriesCount = offlineEntriesCount;
        proxy[index] = experience;
      } else {
        wipeFromCacheId = id;
        proxy.splice(index, 1);
      }
    }
  });

  if (wipeFromCacheId) {
    wipeReferencesFromCache(cache, [
      makeApolloCacheRef(OFFLINE_ITEMS_TYPENAME, wipeFromCacheId),
    ]);
  }

  if (updated) {
    updateOfflineItemsLedger(cache, cacheData);
  }
}

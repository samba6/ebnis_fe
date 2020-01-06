import { OfflineItem } from "../state/offline-resolvers";
import { updateOfflineItemsLedger } from "./write-offline-items-to-cache";
import { queryCacheOfflineItems } from "../state/resolvers/get-experiences-from-cache";
import { InMemoryCache } from "apollo-cache-inmemory";

export function deleteExperiencesIdsFromOfflineItemsInCache(
  client: InMemoryCache,
  ids: string[],
) {
  const cacheData = queryCacheOfflineItems(client).reduce(
    (acc, map) => {
      if (ids.includes(map.id)) {
        return acc;
      }

      acc.push(map);

      return acc;
    },
    [] as OfflineItem[],
  );

  updateOfflineItemsLedger(client, cacheData);
}

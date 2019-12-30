import {
  OFFLINE_ITEMS_QUERY,
  OfflineItemsQueryReturned,
} from "../offline-resolvers";
import { InMemoryCache } from "apollo-cache-inmemory";

export function queryCacheOfflineItems(dataProxy: InMemoryCache) {
  const data = dataProxy.readQuery<OfflineItemsQueryReturned>({
    query: OFFLINE_ITEMS_QUERY,
  });

  return (data && data.offlineItems) || [];
}

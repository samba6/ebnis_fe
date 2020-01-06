import { DataProxy } from "apollo-cache";
import {
  OfflineItemsQueryReturned,
  OFFLINE_ITEMS_QUERY,
  OfflineItem,
} from "../state/offline-resolvers";

export function updateOfflineItemsLedger(
  dataProxy: DataProxy,
  data: OfflineItem[],
) {
  dataProxy.writeQuery<OfflineItemsQueryReturned>({
    query: OFFLINE_ITEMS_QUERY,

    data: {
      offlineItems: data,
    },
  });
}

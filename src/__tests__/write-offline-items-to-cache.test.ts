/* eslint-disable @typescript-eslint/no-explicit-any*/
import { DataProxy } from "apollo-cache";
import { updateOfflineItemsLedger } from "../apollo-cache/write-offline-items-to-cache";
import { OFFLINE_ITEMS_QUERY, OfflineItem } from "../state/offline-resolvers";

test("writes offline items", () => {
  const mockWriteQuery = jest.fn();

  const proxy = {
    writeQuery: mockWriteQuery as any,
  } as DataProxy;

  const data = [{ id: "1" } as OfflineItem];

  updateOfflineItemsLedger(proxy, data);

  expect(mockWriteQuery).toHaveBeenCalledWith({
    query: OFFLINE_ITEMS_QUERY,
    data: {
      offlineItems: data,
    },
  });
});

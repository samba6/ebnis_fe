import { queryCacheOfflineItems } from "../state/resolvers/get-experiences-from-cache";
import {
  incrementOfflineItemCount,
  newOfflineItem,
} from "../apollo-cache/increment-offline-item-count";
import { updateOfflineItemsLedger } from "../apollo-cache/write-offline-items-to-cache";
import { makeOfflineId } from "../constants";
import { InMemoryCache } from "apollo-cache-inmemory";

jest.mock("../apollo-cache/write-offline-items-to-cache");
const mockWriteOfflineItemsToCache = updateOfflineItemsLedger as jest.Mock;

jest.mock("../state/resolvers/get-experiences-from-cache");
const mockQueryCacheOfflineItems = queryCacheOfflineItems as jest.Mock;

beforeEach(() => {
  mockWriteOfflineItemsToCache.mockReset();
  mockQueryCacheOfflineItems.mockReset();
});

test("no offline items", () => {
  mockQueryCacheOfflineItems.mockReturnValue([]);

  incrementOfflineItemCount({} as InMemoryCache, "1");

  expect(mockWriteOfflineItemsToCache.mock.calls[0][1]).toEqual([
    newOfflineItem("1"),
  ]);
});

test("no offline items, noupdate flag - insert", () => {
  mockQueryCacheOfflineItems.mockReturnValue([]);

  incrementOfflineItemCount({} as InMemoryCache, "1");

  expect(mockWriteOfflineItemsToCache.mock.calls[0][1]).toEqual([
    newOfflineItem("1"),
  ]);
});

test("experience found in cache - increment", () => {
  mockQueryCacheOfflineItems.mockReturnValue([
    {
      id: "1",
      offlineEntriesCount: 1,
    },
  ]);

  incrementOfflineItemCount({} as InMemoryCache, "1");

  expect(mockWriteOfflineItemsToCache.mock.calls[0][1]).toEqual([
    {
      id: "1",
      offlineEntriesCount: 2,
    },
  ]);
});

test("experience not found in cache - insert", () => {
  mockQueryCacheOfflineItems.mockReturnValue([
    {
      id: "1",
      offlineEntriesCount: 1,
    },
  ]);

  const experienceId = makeOfflineId("2");

  incrementOfflineItemCount({} as InMemoryCache, experienceId);

  expect(mockWriteOfflineItemsToCache.mock.calls[0][1]).toEqual([
    {
      id: "1",
      offlineEntriesCount: 1,
    },

    newOfflineItem(experienceId),
  ]);
});


import { queryCacheOfflineItems } from "../state/resolvers/get-experiences-from-cache";
import {
  incrementOfflineEntriesCountForExperience,
  newOfflineExperienceInCache,
} from "../apollo-cache/increment-offline-entries-count";
import { writeOfflineItemsToCache } from "../apollo-cache/write-offline-items-to-cache";
import { makeOfflineId } from "../constants";
import {InMemoryCache} from 'apollo-cache-inmemory';

jest.mock("../apollo-cache/write-offline-items-to-cache");
const mockWriteOfflineItemsToCache = writeOfflineItemsToCache as jest.Mock;

jest.mock("../state/resolvers/get-experiences-from-cache");
const mockQueryCacheOfflineItems = queryCacheOfflineItems as jest.Mock;

beforeEach(() => {
  mockWriteOfflineItemsToCache.mockReset();
  mockQueryCacheOfflineItems.mockReset();
});

test("no offline items",  () => {
  mockQueryCacheOfflineItems.mockReturnValue([]);

   incrementOfflineEntriesCountForExperience({} as InMemoryCache, "1");

  expect(mockWriteOfflineItemsToCache.mock.calls[0][1]).toEqual([
    newOfflineExperienceInCache("1"),
  ]);
});

test("experience found in cache - increments",  () => {
  mockQueryCacheOfflineItems.mockReturnValue([
    {
      id: "1",
      offlineEntriesCount: 1,
    },
  ]);

   incrementOfflineEntriesCountForExperience({} as InMemoryCache, "1");

  expect(mockWriteOfflineItemsToCache.mock.calls[0][1]).toEqual([
    {
      id: "1",
      offlineEntriesCount: 2,
    },
  ]);
});

test("experience not found in cache - insert",  () => {
  mockQueryCacheOfflineItems.mockReturnValue([
    {
      id: "1",
      offlineEntriesCount: 1,
    },
  ]);

  const experienceId = makeOfflineId("2");

   incrementOfflineEntriesCountForExperience(
    {} as InMemoryCache,
    experienceId,
  );

  expect(mockWriteOfflineItemsToCache.mock.calls[0][1]).toEqual([
    {
      id: "1",
      offlineEntriesCount: 1,
    },

    newOfflineExperienceInCache(experienceId),
  ]);
});

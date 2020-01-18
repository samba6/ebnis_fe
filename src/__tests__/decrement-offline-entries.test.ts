import {
  decrementOfflineEntriesCountForExperience,
  DecrementOfflineEntriesCountForExperienceArgs,
  decrementOfflineEntriesCountForExperiences,
} from "../apollo-cache/drecrement-offline-entries-count";
import { queryCacheOfflineItems } from "../state/resolvers/get-experiences-from-cache";
import { updateOfflineItemsLedger } from "../apollo-cache/write-offline-items-to-cache";
import { wipeReferencesFromCache } from "../state/resolvers/delete-references-from-cache";
import { makeApolloCacheRef } from "../constants";
import { OFFLINE_ITEMS_TYPENAME } from "../state/offline-resolvers";
import { InMemoryCache } from "apollo-cache-inmemory";

jest.mock("../state/resolvers/get-experiences-from-cache");
const mockQueryCacheOfflineItems = queryCacheOfflineItems as jest.Mock;

jest.mock("../apollo-cache/write-offline-items-to-cache");
const mockUpdateOfflineItemsLedger = updateOfflineItemsLedger as jest.Mock;

jest.mock("../state/resolvers/delete-references-from-cache");
const mockWipeReferencesFromCache = wipeReferencesFromCache as jest.Mock;

const cache = {} as InMemoryCache;

beforeEach(() => {
  mockQueryCacheOfflineItems.mockReset();
  mockUpdateOfflineItemsLedger.mockReset();
  mockWipeReferencesFromCache.mockReset();
});

describe("decrementOfflineEntriesCountForExperience", () => {
  test("no offline items", () => {
    mockQueryCacheOfflineItems.mockReturnValue([]);

    decrementOfflineEntriesCountForExperience(
      {} as DecrementOfflineEntriesCountForExperienceArgs,
    );

    expect(mockUpdateOfflineItemsLedger).not.toHaveBeenCalled();
  });

  test("experienceId not in cache", () => {
    mockQueryCacheOfflineItems.mockReturnValue([
      { id: "1", offlineEntriesCount: 2 },
    ]);

    decrementOfflineEntriesCountForExperience({
      experienceId: "x",
      howMany: 1,
    } as DecrementOfflineEntriesCountForExperienceArgs);

    expect(mockUpdateOfflineItemsLedger).not.toHaveBeenCalled();
  });

  test("decrement offline entry", () => {
    mockQueryCacheOfflineItems.mockReturnValue([
      { id: "1", offlineEntriesCount: 2 },
    ]);

    decrementOfflineEntriesCountForExperience({
      experienceId: "1",
      howMany: 1,
    } as DecrementOfflineEntriesCountForExperienceArgs);

    expect(mockUpdateOfflineItemsLedger.mock.calls[0][1]).toEqual([
      { id: "1", offlineEntriesCount: 1 },
    ]);
  });

  test("decrement last offline entry removes experience", () => {
    mockQueryCacheOfflineItems.mockReturnValue([
      { id: "1", offlineEntriesCount: 1 },
      { id: "2", offlineEntriesCount: 1 },
      { id: "3", offlineEntriesCount: 1 },
    ]);

    decrementOfflineEntriesCountForExperience({
      experienceId: "2",
      howMany: 1,
    } as DecrementOfflineEntriesCountForExperienceArgs);

    expect(mockUpdateOfflineItemsLedger.mock.calls[0][1]).toEqual([
      { id: "1", offlineEntriesCount: 1 },
      { id: "3", offlineEntriesCount: 1 },
    ]);

    expect(mockWipeReferencesFromCache.mock.calls[0][1]).toEqual([
      makeApolloCacheRef(OFFLINE_ITEMS_TYPENAME, "2"),
    ]);
  });
});

describe("decrementOfflineEntriesCountForExperiences", () => {
  test("no offline items - undefined", () => {
    decrementOfflineEntriesCountForExperiences(cache, {});
    expect(mockUpdateOfflineItemsLedger).not.toHaveBeenCalled();
  });

  test("no offline items - empty list", () => {
    mockQueryCacheOfflineItems.mockReturnValue([]);
    decrementOfflineEntriesCountForExperiences(cache, {});
    expect(mockUpdateOfflineItemsLedger).not.toHaveBeenCalled();
  });

  test("no wipe references", () => {
    mockQueryCacheOfflineItems.mockReturnValue([
      { id: "a" },
      { id: "b", offlineEntriesCount: 2 },
    ]);

    decrementOfflineEntriesCountForExperiences(cache, { b: 1 });

    expect(mockWipeReferencesFromCache).not.toHaveBeenCalled();

    expect(mockUpdateOfflineItemsLedger.mock.calls[0][1]).toEqual([
      { id: "a" },
      { id: "b", offlineEntriesCount: 1 },
    ]);
  });

  test("wipe references", () => {
    mockQueryCacheOfflineItems.mockReturnValue([
      { id: "b", offlineEntriesCount: 1 },
    ]);

    decrementOfflineEntriesCountForExperiences(cache, { b: 1 });

    expect(mockWipeReferencesFromCache.mock.calls[0][1]).toEqual([
      makeApolloCacheRef(OFFLINE_ITEMS_TYPENAME, "b"),
    ]);

    expect(mockUpdateOfflineItemsLedger.mock.calls[0][1]).toEqual([]);
  });
});

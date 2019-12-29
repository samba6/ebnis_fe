import {
  decrementOfflineEntriesCountForExperience,
  DecrementOfflineEntriesCountForExperienceArgs,
} from "../apollo-cache/drecrement-offline-entries-count";
import { getExperiencesFromCache } from "../state/resolvers/get-experiences-from-cache";
import { writeOfflineItemsToCache } from "../apollo-cache/write-offline-items-to-cache";

jest.mock("../state/resolvers/get-experiences-from-cache");
const mockGetExperiencesFromCache = getExperiencesFromCache as jest.Mock;

jest.mock("../apollo-cache/write-offline-items-to-cache");
const mockWriteOfflineItemsToCache = writeOfflineItemsToCache as jest.Mock;

beforeEach(() => {
  mockGetExperiencesFromCache.mockReset();
  mockWriteOfflineItemsToCache.mockReset();
});

test("no offline items", async () => {
  mockGetExperiencesFromCache.mockResolvedValue([]);

  decrementOfflineEntriesCountForExperience(
    {} as DecrementOfflineEntriesCountForExperienceArgs,
  );

  expect(mockWriteOfflineItemsToCache).not.toHaveBeenCalled();
});

test("experienceId not in cache", async () => {
  mockGetExperiencesFromCache.mockResolvedValue([
    { id: "1", offlineEntriesCount: 2 },
  ]);

  await decrementOfflineEntriesCountForExperience({
    experienceId: "x",
    howMany: 1,
  } as DecrementOfflineEntriesCountForExperienceArgs);

  expect(mockWriteOfflineItemsToCache).not.toHaveBeenCalled();
});

test("decrement offline entry", async () => {
  mockGetExperiencesFromCache.mockResolvedValue([
    { id: "1", offlineEntriesCount: 2 },
  ]);

  await decrementOfflineEntriesCountForExperience({
    experienceId: "1",
    howMany: 1,
  } as DecrementOfflineEntriesCountForExperienceArgs);

  expect(mockWriteOfflineItemsToCache.mock.calls[0][1]).toEqual([
    { id: "1", offlineEntriesCount: 1 },
  ]);
});

test("decrement last offline entry removes experience", async () => {
  mockGetExperiencesFromCache.mockResolvedValue([
    { id: "1", offlineEntriesCount: 1 },
    { id: "2", offlineEntriesCount: 1 },
    { id: "3", offlineEntriesCount: 1 },
  ]);

  await decrementOfflineEntriesCountForExperience({
    experienceId: "2",
    howMany: 1,
  } as DecrementOfflineEntriesCountForExperienceArgs);

  expect(mockWriteOfflineItemsToCache.mock.calls[0][1]).toEqual([
    { id: "1", offlineEntriesCount: 1 },
    { id: "3", offlineEntriesCount: 1 },
  ]);
});

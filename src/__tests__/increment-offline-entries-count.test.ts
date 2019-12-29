import { ApolloClient } from "apollo-client";
import { getExperiencesFromCache } from "../state/resolvers/get-experiences-from-cache";
import {
  incrementOfflineEntriesCountForExperience,
  newOfflineExperienceInCache,
} from "../apollo-cache/increment-offline-entries-count";
import { writeOfflineItemsToCache } from "../apollo-cache/write-offline-items-to-cache";
import { makeOfflineId } from "../constants";

jest.mock("../apollo-cache/write-offline-items-to-cache");
const mockWriteOfflineItemsToCache = writeOfflineItemsToCache as jest.Mock;

jest.mock("../state/resolvers/get-experiences-from-cache");
const mockGetExperiencesFromCache = getExperiencesFromCache as jest.Mock;

beforeEach(() => {
  mockWriteOfflineItemsToCache.mockReset();
  mockGetExperiencesFromCache.mockReset();
});

test("no offline items", async () => {
  mockGetExperiencesFromCache.mockResolvedValue([]);

  await incrementOfflineEntriesCountForExperience({} as ApolloClient<{}>, "1");

  expect(mockWriteOfflineItemsToCache.mock.calls[0][1]).toEqual([
    newOfflineExperienceInCache("1"),
  ]);
});

test("experience found in cache - increments", async () => {
  mockGetExperiencesFromCache.mockResolvedValue([
    {
      id: "1",
      offlineEntriesCount: 1,
    },
  ]);

  await incrementOfflineEntriesCountForExperience({} as ApolloClient<{}>, "1");

  expect(mockWriteOfflineItemsToCache.mock.calls[0][1]).toEqual([
    {
      id: "1",
      offlineEntriesCount: 2,
    },
  ]);
});

test("experience not found in cache - insert", async () => {
  mockGetExperiencesFromCache.mockResolvedValue([
    {
      id: "1",
      offlineEntriesCount: 1,
    },
  ]);

  const experienceId = makeOfflineId("2");

  await incrementOfflineEntriesCountForExperience(
    {} as ApolloClient<{}>,
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

import { ApolloClient } from "apollo-client";
import { deleteExperiencesIdsFromOfflineItemsInCache } from "../apollo-cache/delete-experiences-ids-from-offline-items";
import { writeOfflineItemsToCache } from "../apollo-cache/write-offline-items-to-cache";
import { getExperiencesFromCache } from "../state/resolvers/get-experiences-from-cache";

jest.mock("../apollo-cache/write-offline-items-to-cache");
const mockwriteOfflineItemsToCache = writeOfflineItemsToCache as jest.Mock;

jest.mock("../state/resolvers/get-experiences-from-cache");
const mockGetExperiencesFromCache = getExperiencesFromCache as jest.Mock;

it("deletes experiences ids", async () => {
  mockGetExperiencesFromCache.mockResolvedValue([{ id: "1" }, { id: "2" }]);

  await deleteExperiencesIdsFromOfflineItemsInCache({} as ApolloClient<{}>, [
    "1",
  ]);

  expect(mockwriteOfflineItemsToCache.mock.calls[0][1]).toEqual([{ id: "2" }]);
});

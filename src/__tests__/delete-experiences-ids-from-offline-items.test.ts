import { deleteExperiencesIdsFromOfflineItemsInCache } from "../apollo-cache/delete-experiences-ids-from-offline-items";
import { updateOfflineItemsLedger } from "../apollo-cache/write-offline-items-to-cache";
import { queryCacheOfflineItems } from "../state/resolvers/get-experiences-from-cache";
import { InMemoryCache } from "apollo-cache-inmemory";

jest.mock("../apollo-cache/write-offline-items-to-cache");
const mockwriteOfflineItemsToCache = updateOfflineItemsLedger as jest.Mock;

jest.mock("../state/resolvers/get-experiences-from-cache");
const mockQueryCacheOfflineItems = queryCacheOfflineItems as jest.Mock;

it("deletes experiences ids", () => {
  mockQueryCacheOfflineItems.mockReturnValue([{ id: "1" }, { id: "2" }]);

  deleteExperiencesIdsFromOfflineItemsInCache({} as InMemoryCache, ["1"]);

  expect(mockwriteOfflineItemsToCache.mock.calls[0][1]).toEqual([{ id: "2" }]);
});

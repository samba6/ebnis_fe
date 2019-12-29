import { ApolloClient } from "apollo-client";
import { OfflineItem } from "../state/offline-resolvers";
import { writeOfflineItemsToCache } from "./write-offline-items-to-cache";
import { getExperiencesFromCache } from "../state/resolvers/get-experiences-from-cache";

export async function deleteExperiencesIdsFromOfflineItemsInCache(
  client: ApolloClient<{}>,
  ids: string[],
) {
  const cacheData = (await getExperiencesFromCache(client)).reduce(
    (acc, map) => {
      if (ids.includes(map.id)) {
        return acc;
      }

      acc.push(map);

      return acc;
    },
    [] as OfflineItem[],
  );

  writeOfflineItemsToCache(client, cacheData);
}

import { DataProxy } from "apollo-cache";
import {
  OfflineItemsQueryReturned,
  OFFLINE_ITEMS_QUERY,
  OfflineItem,
  OFFLINE_ITEMS_TYPENAME,
} from "../offline-resolvers";
import { isOfflineId } from "../../constants";
import { getExperiencesFromCache } from "./get-experiences-from-cache";
import ApolloClient from "apollo-client";
import immer from "immer";

export function writeOfflineItemsToCache(
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

function newOfflineExperienceInCache(experienceId: string) {
  return {
    id: experienceId,
    offlineEntriesCount: isOfflineId(experienceId) ? 0 : 1,
    __typename: OFFLINE_ITEMS_TYPENAME,
  };
}

export async function updateCacheExperienceOfflineEntriesCount(
  client: ApolloClient<{}>,
  experienceId: string,
) {
  let cacheData = await getExperiencesFromCache(client);

  if (cacheData.length === 0) {
    cacheData = [newOfflineExperienceInCache(experienceId)];
  } else {
    cacheData = immer(cacheData, proxy => {
      let index = 0;
      let len = proxy.length;
      let experienceFound = false;

      for (; index < len; index++) {
        const experience = proxy[index];

        if (experience.id === experienceId) {
          ++experience.offlineEntriesCount;
          proxy[index] = experience;
          experienceFound = true;
          break;
        }
      }

      if (!experienceFound) {
        proxy.push(newOfflineExperienceInCache(experienceId));
      }
    });
  }

  writeOfflineItemsToCache(client, cacheData);
}

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

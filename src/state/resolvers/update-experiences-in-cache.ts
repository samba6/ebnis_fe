import { DataProxy } from "apollo-cache";
import {
  AllExperiencesQueryReturned,
  ALL_EXPERIENCES_QUERY,
  AllExperiences,
  ALL_EXPERIENCES_TYPENAME,
} from "../offline-resolvers";
import { isOfflineId } from "../../constants";
import { getExperiencesFromCache } from "./get-experiences-from-cache";
import ApolloClient from "apollo-client";
import immer from "immer";

export function writeAllExperiencesToCache(
  dataProxy: DataProxy,
  data: AllExperiences[],
) {
  dataProxy.writeQuery<AllExperiencesQueryReturned>({
    query: ALL_EXPERIENCES_QUERY,

    data: {
      allExperiences: data,
    },
  });
}

export async function updateEntriesCountInCache(
  client: ApolloClient<{}>,
  id: string,
) {
  let cacheData = await getExperiencesFromCache(client);

  if (cacheData.length === 0) {
    cacheData = [
      {
        id: id,
        offlineEntriesCount: isOfflineId(id) ? 0 : 1,
        __typename: ALL_EXPERIENCES_TYPENAME,
      },
    ];
  } else {
    cacheData = immer(cacheData, proxy => {
      let index = 0;
      let len = proxy.length;

      for (; index < len; index++) {
        const map = proxy[index];

        if (map.id === id) {
          ++map.offlineEntriesCount;
        }

        proxy[index] = map;
      }
    });
  }

  writeAllExperiencesToCache(client, cacheData);
}

export async function deleteExperiencesIdsFromAllExperiencesInCache(
  client: ApolloClient<{}>,
  ids: string[],
) {
  const cacheData = (await getExperiencesFromCache(
    client,
  )).reduce(
    (acc, map) => {
      if (ids.includes(map.id)) {
        return acc;
      }

      acc.push(map);

      return acc;
    },
    [] as AllExperiences[],
  );

  writeAllExperiencesToCache(client, cacheData);
}

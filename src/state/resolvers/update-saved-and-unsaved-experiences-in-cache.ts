import { DataProxy } from "apollo-cache";
import {
  SavedAndUnsavedExperiencesQueryReturned,
  SAVED_AND_UNSAVED_EXPERIENCES_QUERY,
  SavedAndUnsavedExperiences,
  SAVED_AND_UNSAVED_EXPERIENCE_TYPENAME,
} from "../unsaved-resolvers";
import { isUnsavedId } from "../../constants";
import { getSavedAndUnsavedExperiencesFromCache } from "./get-saved-and-unsaved-experiences-from-cache";
import ApolloClient from "apollo-client";
import immer from "immer";

export function writeSavedAndUnsavedExperiencesToCache(
  dataProxy: DataProxy,
  data: SavedAndUnsavedExperiences[],
) {
  dataProxy.writeQuery<SavedAndUnsavedExperiencesQueryReturned>({
    query: SAVED_AND_UNSAVED_EXPERIENCES_QUERY,

    data: {
      savedAndUnsavedExperiences: data,
    },
  });
}

export async function updateEntriesCountSavedAndUnsavedExperiencesInCache(
  client: ApolloClient<{}>,
  id: string,
) {
  let cacheData = await getSavedAndUnsavedExperiencesFromCache(client);

  if (cacheData.length === 0) {
    cacheData = [
      {
        id: id,
        unsavedEntriesCount: isUnsavedId(id) ? 0 : 1,
        __typename: SAVED_AND_UNSAVED_EXPERIENCE_TYPENAME,
      },
    ];
  } else {
    cacheData = immer(cacheData, proxy => {
      let index = 0;
      let len = proxy.length;

      for (; index < len; index++) {
        const map = proxy[index];

        if (map.id === id) {
          ++map.unsavedEntriesCount;
        }

        proxy[index] = map;
      }
    });
  }

  writeSavedAndUnsavedExperiencesToCache(client, cacheData);
}

export async function deleteExperiencesIdsFromSavedAndUnsavedExperiencesInCache(
  client: ApolloClient<{}>,
  ids: string[],
) {
  const cacheData = (await getSavedAndUnsavedExperiencesFromCache(
    client,
  )).reduce(
    (acc, map) => {
      if (ids.includes(map.id)) {
        return acc;
      }

      acc.push(map);

      return acc;
    },
    [] as SavedAndUnsavedExperiences[],
  );

  writeSavedAndUnsavedExperiencesToCache(client, cacheData);
}

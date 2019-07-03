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
  let existsInCache = false;

  const cacheData = (await getSavedAndUnsavedExperiencesFromCache(
    client,
  )).reduce(
    (acc, map) => {
      if (map.id === id) {
        ++map.unsavedEntriesCount;
        existsInCache = true;
      }

      acc.push(map);

      return acc;
    },
    [] as SavedAndUnsavedExperiences[],
  );

  if (existsInCache === false) {
    cacheData.push({
      id: id,
      unsavedEntriesCount: isUnsavedId(id) ? 0 : 1,
      __typename: SAVED_AND_UNSAVED_EXPERIENCE_TYPENAME,
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

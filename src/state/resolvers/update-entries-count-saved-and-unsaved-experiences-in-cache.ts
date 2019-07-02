import {
  SavedAndUnsavedExperiences,
  SAVED_AND_UNSAVED_EXPERIENCE_TYPENAME,
} from "../unsaved-resolvers";
import { isUnsavedId } from "../../constants";
import { getSavedAndUnsavedExperiencesFromCache } from "./get-saved-and-unsaved-experiences-from-cache";
import { writeSavedAndUnsavedExperiencesToCache } from "./write-saved-and-unsaved-experiences-to-cache";
import ApolloClient from "apollo-client";

export async function UpdateEntriesCountSavedAndUnsavedExperiencesInCache(
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

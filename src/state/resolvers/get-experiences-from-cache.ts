import {
  SAVED_AND_UNSAVED_EXPERIENCES_QUERY,
  SavedAndUnsavedExperiencesQueryReturned,
} from "../offline-resolvers";
import ApolloClient from "apollo-client";

export async function getExperiencesFromCache(
  dataProxy: ApolloClient<{}>,
) {
  const { data } = await dataProxy.query<
    SavedAndUnsavedExperiencesQueryReturned
  >({
    query: SAVED_AND_UNSAVED_EXPERIENCES_QUERY,
    fetchPolicy: "cache-only",
  });

  return (data && data.savedAndUnsavedExperiences) || [];
}

import {
  SAVED_AND_UNSAVED_EXPERIENCES_QUERY,
  SavedAndUnsavedExperiencesQueryReturned,
} from "../unsaved-resolvers";
import ApolloClient from "apollo-client";

export async function getSavedAndUnsavedExperiencesFromCache(
  dataProxy: ApolloClient<{}>,
) {
  const { data } = await dataProxy.query<
    SavedAndUnsavedExperiencesQueryReturned
  >({
    query: SAVED_AND_UNSAVED_EXPERIENCES_QUERY,
  });

  return (data && data.savedAndUnsavedExperiences) || [];
}

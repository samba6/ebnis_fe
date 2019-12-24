import {
  ALL_EXPERIENCES_QUERY,
  AllExperiencesQueryReturned,
} from "../offline-resolvers";
import ApolloClient from "apollo-client";

export async function getExperiencesFromCache(
  dataProxy: ApolloClient<{}>,
) {
  const { data } = await dataProxy.query<
    AllExperiencesQueryReturned
  >({
    query: ALL_EXPERIENCES_QUERY,
    fetchPolicy: "cache-only",
  });

  return (data && data.allExperiences) || [];
}

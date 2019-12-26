import {
  OFFLINE_ITEMS_QUERY,
  OfflineItemsQueryReturned,
} from "../offline-resolvers";
import ApolloClient from "apollo-client";

export async function getExperiencesFromCache(
  dataProxy: ApolloClient<{}>,
) {
  const { data } = await dataProxy.query<
    OfflineItemsQueryReturned
  >({
    query: OFFLINE_ITEMS_QUERY,
    fetchPolicy: "cache-only",
  });

  return (data && data.offlineItems) || [];
}

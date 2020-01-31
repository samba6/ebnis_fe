/* istanbul ignore file */
import ApolloClient from "apollo-client";
import {
  PreFetchExperiences,
  PreFetchExperiencesVariables,
} from "../../graphql/apollo-types/PreFetchExperiences";
import {
  PRE_FETCH_EXPERIENCES_QUERY,
  GET_EXPERIENCES_MINI_QUERY,
  getExperienceConnectionMiniVariables,
} from "../../graphql/get-experience-connection-mini.query";
import { InMemoryCache } from "apollo-cache-inmemory";
import { removeQueriesAndMutationsFromCache } from "../../state/resolvers/delete-references-from-cache";
import { entriesPaginationVariables } from "../../graphql/get-experience-full.query";
import {
  GetExperienceConnectionMini,
  GetExperienceConnectionMiniVariables,
} from "../../graphql/apollo-types/GetExperienceConnectionMini";
import { ExperienceConnectionFragment_edges } from "../../graphql/apollo-types/ExperienceConnectionFragment";
import { ExperienceMiniFragment } from "../../graphql/apollo-types/ExperienceMiniFragment";
import { isOfflineId } from "../../constants";

export function cleanupObservableSubscription(
  subscription: ZenObservable.Subscription,
) {
  subscription.unsubscribe();
}

export async function preFetchExperiences({
  client,
  onDone,
  cache,
}: PreFetchExperiencesFnArgs) {
  const { data } = await client.query<
    GetExperienceConnectionMini,
    GetExperienceConnectionMiniVariables
  >({
    query: GET_EXPERIENCES_MINI_QUERY,
    variables: getExperienceConnectionMiniVariables,
  });

  const edges = data && data.getExperiences && data.getExperiences.edges;

  if (!edges || !edges.length) {
    return;
  }

  const ids = edges.reduce((acc, e) => {
    const { node } = e as ExperienceConnectionFragment_edges;
    const { hasUnsaved, id } = node as ExperienceMiniFragment;

    if (hasUnsaved || isOfflineId(id)) {
      return acc;
    }

    acc.push(id);
    return acc;
  }, [] as string[]);

  await client.query<PreFetchExperiences, PreFetchExperiencesVariables>({
    query: PRE_FETCH_EXPERIENCES_QUERY,
    variables: {
      input: {
        ids,
      },
      ...entriesPaginationVariables,
    },
  });

  onDone();

  setTimeout(() => {
    // we really do not want to keep the cached values of this operation
    // around as we only fire the query once during app boot.
    removeQueriesAndMutationsFromCache(cache, [
      `getExperiences({"input":{"ids":`,
    ]);
  });
}

export interface PreFetchExperiencesFnArgs {
  client: ApolloClient<{}>;
  onDone: () => void;
  cache: InMemoryCache;
}

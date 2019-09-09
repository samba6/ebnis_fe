import { DEFAULT_UNSAVED_STATES } from "./unsaved-resolvers";
import ApolloClient from "apollo-client";
import { InMemoryCache } from "apollo-cache-inmemory";

export interface CacheContext {
  cache: InMemoryCache;
  client: ApolloClient<{}>;
  getCacheKey: (args: { __typename: string; id: string }) => string;
}

export function defaultGetCacheKeyFn({
  id,
  __typename,
}: {
  __typename: string;
  id: string;
}) {
  return `${__typename}:${id}`;
}

export type LocalResolverFn<TVariables = {}, TReturnedValue = void> = (
  root: object,
  variables: TVariables,
  context: CacheContext,
) => TReturnedValue;

export interface LocalState {
  staleToken: string | null;
  loggedOutUser: null;
}

export function initState() {
  return {
    resolvers: [],
    defaults: {
      staleToken: null,
      loggedOutUser: null,
      ...DEFAULT_UNSAVED_STATES,
    },
  };
}

export const MUTATION_NAME_createUnsavedExperience = "createUnsavedExperience";

export const MUTATION_NAME_createUnsavedEntry = "createUnsavedEntry";

export const QUERY_NAME_getExperience = "getExperience";

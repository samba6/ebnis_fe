import { InMemoryCache } from "apollo-cache-inmemory";

import { getToken } from "./tokens";
import {
  connectionResolver,
  ConnectionQueryData,
  DEFAULT_CONNECTION_STATUS
} from "./connection.resolver";
import { userResolver } from "./user.resolver";
import ApolloClient from "apollo-client";

export interface CacheContext {
  cache: InMemoryCache;
  client: ApolloClient<{}>;
  getCacheKey: (args: { __typename: string; id: string }) => string;
}

export type LocalResolverFn<TVariables, TReturnedValue = void> = (
  root: object,
  variables: TVariables,
  context: CacheContext
) => TReturnedValue;

export type LocalState = ConnectionQueryData & {
  staleToken: string | null;
  user: null;
  loggedOutUser: null;
};

export function initState() {
  return {
    resolvers: {
      Mutation: {
        connected: connectionResolver,
        user: userResolver
      },

      Query: {}
    },
    defaults: {
      connected: DEFAULT_CONNECTION_STATUS,
      staleToken: getToken(),
      user: null,
      loggedOutUser: null,
      unsavedExperiences: [],
      unsavedEntries: []
    }
  };
}

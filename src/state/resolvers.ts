import { InMemoryCache } from "apollo-cache-inmemory";
import {
  connectionResolvers,
  ConnectionQueryData,
  DEFAULT_CONNECTION_STATUS
} from "./connection.resolver";
import { userLocalResolvers } from "./user.resolver";
import ApolloClient from "apollo-client";
import { DEFAULT_UNSAVED_STATES } from "./sync-unsaved-resolver";

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
  loggedOutUser: null;
};

export function initState() {
  return {
    resolvers: [connectionResolvers, userLocalResolvers],
    defaults: {
      connected: DEFAULT_CONNECTION_STATUS,
      staleToken: null,
      loggedOutUser: null,
      ...DEFAULT_UNSAVED_STATES
    }
  };
}

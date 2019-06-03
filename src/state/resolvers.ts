import { InMemoryCache } from "apollo-cache-inmemory";

// import { resetClientAndPersistor } from "../containers/AppContext/set-up";
import { getToken } from "./tokens";
import { connectionResolver } from "./connection.resolver";
import { userResolver } from "./user.resolver";
import ApolloClient from "apollo-client";

export type LocalResolverFn<TVariables, TReturnedValue = void> = (
  root: object,
  variables: TVariables,
  context: { cache: InMemoryCache; client: ApolloClient<{}> }
) => TReturnedValue;

export interface LocalState {
  staleToken: string | null;
  user: null;
  loggedOutUser: null;
  connected: {
    __typename: string;
    isConnected: boolean;
  };
}

export function initState() {
  return {
    resolvers: {
      Mutation: {
        connected: connectionResolver,
        user: userResolver
      }
    },
    defaults: {
      connected: {
        __typename: "ConnectionStatus",
        isConnected: false,
        appNewlyLoaded: true
      },
      staleToken: getToken(),
      user: null,
      loggedOutUser: null,
      unsavedExperiences: []
    }
  };
}

import { InMemoryCache } from "apollo-cache-inmemory";

// import { resetClientAndPersistor } from "../containers/AppContext/set-up";
import { getToken } from "./tokens";
import { updateConnectionResolver } from "./update-connection.resolver";
import { userResolver } from "./user.resolver";

export type LocalResolverFn<TVariables, TReturnedValue = void> = (
  fieldName: string,
  variables: TVariables,
  context: { cache: InMemoryCache }
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
        connected: updateConnectionResolver,
        user: userResolver
      }
    },
    defaults: {
      connected: {
        __typename: "ConnectionStatus",
        isConnected: true
      },
      staleToken: getToken(),
      user: null,
      loggedOutUser: null
    }
  };
}

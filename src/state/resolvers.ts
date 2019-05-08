import { InMemoryCache } from "apollo-cache-inmemory";

import { UserFragment } from "../graphql/apollo-gql.d";
import { Variable as UserMutationVar } from "./user.local.mutation";
import USER_QUERY, { UserLocalGqlData } from "./auth.local.query";
// import { resetClientAndPersistor } from "../containers/AppContext/set-up";
import { getToken, clearToken, storeToken } from "./tokens";

type ClientStateFn<TVariables> = (
  fieldName: string,
  variables: TVariables,
  context: { cache: InMemoryCache }
) => void;

const updateConn: ClientStateFn<{
  isConnected: boolean;
}> = (_, { isConnected }, { cache }) => {
  const connected = {
    __typename: "ConnectionStatus",
    isConnected
  };

  cache.writeData({ data: { connected } });
  return connected;
};

const userMutation: ClientStateFn<UserMutationVar> = async (
  _,
  { user },
  { cache }
) => {
  if (user) {
    cache.writeData({ data: { user, staleToken: null, loggedOutUser: null } });
    storeToken(user.jwt);

    return user;
  }
  // MEANS WE HAVE LOGGED OUT. we store the current user as `loggedOutUser`
  // so we can pre-fill the sign in form with e.g. user email

  const { user: loggedOutUser } = {
    ...(cache.readQuery<UserLocalGqlData>({ query: USER_QUERY }) || {
      user: null
    })
  };

  const data = {
    user: null,
    staleToken: null,
    currentProject: null,
    searchComponentState: null
  } as {
    loggedOutUser?: UserFragment | null;
  };

  if (loggedOutUser) {
    // await resetClientAndPersistor();
    data.loggedOutUser = loggedOutUser;
  }

  await cache.writeData({
    data
  });
  clearToken();

  return loggedOutUser;
};

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
        connected: updateConn,
        user: userMutation
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

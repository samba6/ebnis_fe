import { withClientState } from "apollo-link-state";
import { InMemoryCache } from "apollo-cache-inmemory";

import { TOKEN_KEY } from "../constants";
import { UserFragment } from "../graphql/apollo-gql";
import { Variable as UserMutationVar } from "./user.local.mutation";
import USER_QUERY, { UserLocalGqlData } from "./auth.local.query";
import { resetClientAndPersistor } from "./set-up";

type ClientStateFn<TVariables> = (
  fieldName: string,
  variables: TVariables,
  context: { cache: InMemoryCache }
) => void;

const updateNetworkStatus: ClientStateFn<{
  isConnected: boolean;
}> = (_, { isConnected }, { cache }) => {
  const data = {
    networkStatus: {
      __typename: "NetworkStatus",
      isConnected
    }
  };
  cache.writeData({ data });
  return null;
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
    await resetClientAndPersistor();
    data.loggedOutUser = loggedOutUser;
  }

  await cache.writeData({
    data
  });
  clearToken();

  return loggedOutUser;
};

export default (cache: InMemoryCache) => {
  return withClientState({
    cache,
    resolvers: {
      Mutation: {
        updateNetworkStatus,
        user: userMutation
      }
    },
    defaults: {
      networkStatus: null,
      staleToken: getToken(),
      user: null,
      loggedOutUser: null
    }
  });
};

export const getToken = (): string | null =>
  localStorage.getItem(TOKEN_KEY) || null;

const storeToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);

const clearToken = () => localStorage.removeItem(TOKEN_KEY);

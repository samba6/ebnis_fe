import { LocalResolverFn } from "./resolvers";
import { UserFragment } from "../graphql/apollo-types/UserFragment";
import { UserLocalMutationVariable } from "./user.local.mutation";
import USER_QUERY, { UserLocalGqlData } from "./auth.local.query";
import { clearToken, storeToken, storeUser, clearUser } from "./tokens";

export const userResolver: LocalResolverFn<
  UserLocalMutationVariable,
  Promise<UserFragment | null | undefined>
> = async (_, { user }, { cache }) => {
  if (user) {
    /**
     * We store user in local storage as a temporary fix because reading user
     * out of apollo local state immediately after login does not seem to work
     */
    storeUser(user);

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
    staleToken: null
  } as {
    loggedOutUser?: UserFragment | null;
  };

  if (loggedOutUser) {
    // await resetClientAndPersistor();
    data.loggedOutUser = loggedOutUser;
  }

  clearUser();

  await cache.writeData({
    data
  });
  clearToken();

  return loggedOutUser;
};

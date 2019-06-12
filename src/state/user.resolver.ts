import { LocalResolverFn } from "./resolvers";
import { UserFragment } from "../graphql/apollo-types/UserFragment";
import {
  clearToken,
  storeToken,
  storeUser,
  clearUser,
  getUser
} from "./tokens";
import gql from "graphql-tag";
import { DataValue } from "react-apollo";
import { userFragment } from "../graphql/user.fragment";
import { graphql } from "react-apollo";
import { MutationFn } from "react-apollo";

const USER_LOCAL_QUERY = gql`
  query UserLocalQuery {
    loggedOutUser @client {
      ...UserFragment
    }

    staleToken @client
  }

  ${userFragment}
`;

export const userLocalGql = graphql<
  {},
  UserLocalQueryReturned,
  {},
  UserLocalGqlProps | undefined
>(USER_LOCAL_QUERY, {
  props: ({ data }) =>
    data && {
      localUser: data
    }
});

interface UserLocalQueryReturned {
  loggedOutUser?: UserFragment | null;
  staleToken?: string | null;
}

export type UserLocalQueryData = DataValue<UserLocalQueryReturned>;

export interface UserLocalGqlProps {
  localUser?: UserLocalQueryData;
}

export const USER_LOCAL_MUTATION = gql`
  mutation UserLocalMutation($user: LocalUserInput!) {
    localUser(user: $user) @client {
      ...UserFragment
    }
  }

  ${userFragment}
`;

export interface UserLocalMutationVariable {
  user: UserFragment | null;
}

type UserLocalMutationFn = MutationFn<
  UserLocalMutationVariable,
  UserLocalMutationVariable
>;

export interface UserLocalMutationProps {
  updateLocalUser: UserLocalMutationFn;
}

export const userLocalMutationGql = graphql<
  {},
  UserLocalMutationVariable,
  UserLocalMutationVariable,
  UserLocalMutationProps | undefined
>(USER_LOCAL_MUTATION, {
  props: ({ mutate }) =>
    mutate && {
      updateLocalUser: mutate
    }
});

export const userMutationResolver: LocalResolverFn<
  UserLocalMutationVariable,
  UserFragment | null | undefined
> = (_, { user }, { cache }) => {
  if (user) {
    storeUser(user);

    cache.writeData({
      data: { staleToken: user.jwt, loggedOutUser: null }
    });

    storeToken(user.jwt);

    return user;
  }
  // MEANS WE HAVE LOGGED OUT. we store the current user as `loggedOutUser`
  // so we can pre-fill the sign in form with e.g. user email

  const loggedOutUser = getUser();

  clearUser();

  cache.writeData({
    data: { loggedOutUser, staleToken: null }
  });

  clearToken();

  return loggedOutUser;
};

export const userLocalResolvers = {
  Mutation: {
    localUser: userMutationResolver
  },

  Query: {}
};

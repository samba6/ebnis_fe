import gql from "graphql-tag";
import { graphql } from "react-apollo";
import { MutationFn } from "react-apollo";

import { UserFragment } from "../graphql/apollo-types/UserFragment";
import { userFragment } from "../graphql/user.fragment";

export const USER_LOCAL_MUTATION = gql`
  mutation UserLocalMutation($user: LocalUserInput!) {
    user(user: $user) @client {
      ...UserFragment
    }
  }

  ${userFragment}
`;

export interface UserLocalMutationVariable {
  user: UserFragment | null;
}

type Fn = MutationFn<UserLocalMutationVariable, UserLocalMutationVariable>;

export interface UserLocalMutationProps {
  updateLocalUser: Fn;
}

export const userLocalMutationGql = graphql<
  {},
  UserLocalMutationVariable,
  UserLocalMutationVariable,
  UserLocalMutationProps
>(USER_LOCAL_MUTATION, {
  props: props => {
    const mutate = props.mutate as Fn;

    return {
      updateLocalUser: mutate
    };
  }
});

import gql from "graphql-tag";
import { MutationFn } from "react-apollo";

import userFragment from "./user.fragment";
import {
  LoginMutation,
  LoginMutationVariables,
} from "./apollo-types/LoginMutation";

export const LOGIN_MUTATION = gql`
  mutation LoginMutation($login: LoginUser!) {
    login(login: $login) {
      ...UserFragment
    }
  }
  ${userFragment}
`;

export type LoginMutationFn = MutationFn<LoginMutation, LoginMutationVariables>;

export interface LoginMutationProps {
  login?: LoginMutationFn;
}

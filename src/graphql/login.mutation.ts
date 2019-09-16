import gql from "graphql-tag";
import userFragment from "./user.fragment";
import {
  LoginMutation,
  LoginMutationVariables,
} from "./apollo-types/LoginMutation";
import { MutationFunction } from "react-apollo";

export const LOGIN_MUTATION = gql`
  mutation LoginMutation($login: LoginUser!) {
    login(login: $login) {
      ...UserFragment
    }
  }
  ${userFragment}
`;

export type LoginMutationFn = MutationFunction<
  LoginMutation,
  LoginMutationVariables
>;

export interface LoginMutationProps {
  login?: LoginMutationFn;
}

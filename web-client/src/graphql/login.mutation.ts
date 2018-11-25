import gql from "graphql-tag";
import { MutationFn } from "react-apollo";

import userFragment from "./user.fragment";
import { LoginMutation, LoginMutationVariables } from "./apollo-gql";

export const loginMutation = gql`
  mutation LoginMutation($login: LoginUser!) {
    login(login: $login) {
      ...UserFragment
    }
  }
  ${userFragment}
`;

export default loginMutation;

export interface LoginMutationProps {
  login?: MutationFn<LoginMutation, LoginMutationVariables>;
}

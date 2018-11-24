import gql from "graphql-tag";
import { MutationFn } from "react-apollo";

import userFragment from "./user.fragment";
import { UserRegMutation, UserRegMutationVariables } from "./apollo-gql";

export const userRegMutation = gql`
  mutation UserRegMutation($registration: Registration!) {
    registration(registration: $registration) {
      ...UserFragment
    }
  }
  ${userFragment}
`;

export default userRegMutation;

export type RegFn = MutationFn<UserRegMutation, UserRegMutationVariables>;

export interface RegMutationProps {
  regUser?: RegFn;
}

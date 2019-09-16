import gql from "graphql-tag";
import userFragment from "./user.fragment";
import {
  UserRegMutation,
  UserRegMutationVariables,
} from "./apollo-types/UserRegMutation";
import { MutationFunction } from "react-apollo";

export const REG_USER_MUTATION = gql`
  mutation UserRegMutation($registration: Registration!) {
    registration(registration: $registration) {
      ...UserFragment
    }
  }
  ${userFragment}
`;

export type UserRegMutationFn = MutationFunction<
  UserRegMutation,
  UserRegMutationVariables
>;

export interface RegMutationProps {
  regUser?: UserRegMutationFn;
}

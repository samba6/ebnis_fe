import gql from "graphql-tag";
import userFragment from "./user.fragment";
import {
  UserRegMutation,
  UserRegMutationVariables,
} from "./apollo-types/UserRegMutation";

export const REGISTER_USER_MUTATION = gql`
  mutation UserRegMutation($registration: Registration!) {
    registration(registration: $registration) {
      ...UserFragment
    }
  }
  ${userFragment}
`;


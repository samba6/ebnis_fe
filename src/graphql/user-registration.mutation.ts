import gql from "graphql-tag";
import userFragment from "./user.fragment";

export const REGISTER_USER_MUTATION = gql`
  mutation UserRegMutation($registration: Registration!) {
    registration(registration: $registration) {
      ...UserFragment
    }
  }
  ${userFragment}
`;

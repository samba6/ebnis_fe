import gql from "graphql-tag";
import { MutationFn } from "react-apollo";

import {
  CreateExpMutation,
  CreateExpMutationVariables
} from "./apollo-types/CreateExpMutation";
import { CREATE_EXPERIENCE_FRAGMENT } from "./create-experience.fragment";

export const EXP_MUTATION = gql`
  mutation CreateExpMutation($exp: CreateExp!) {
    exp(exp: $exp) {
      ...CreateExperienceFragment
    }
  }

  ${CREATE_EXPERIENCE_FRAGMENT}
`;

export type CreateExpMutationFn = MutationFn<
  CreateExpMutation,
  CreateExpMutationVariables
>;

export interface CreateExpMutationProps {
  createExp?: CreateExpMutationFn;
}

import gql from "graphql-tag";
import { MutationFn } from "react-apollo";

import {
  CreateExpMutation,
  CreateExpMutationVariables
} from "./apollo-types/CreateExpMutation";
import { expFrag } from "./exp.fragment";

export const EXP_MUTATION = gql`
  mutation CreateExpMutation($exp: CreateExp!) {
    exp(exp: $exp) {
      ...ExpFrag
    }
  }

  ${expFrag}
`;

export type CreateExpMutationFn = MutationFn<
  CreateExpMutation,
  CreateExpMutationVariables
>;

export interface CreateExpMutationProps {
  createExp?: CreateExpMutationFn;
}

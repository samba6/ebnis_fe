import gql from "graphql-tag";
import { MutationFn } from "react-apollo";

import { CreateExpMutation, CreateExpMutationVariables } from "./apollo-gql.d";
import { expFrag } from "./exp.fragment";

export const createExpMutation = gql`
  mutation CreateExpMutation($exp: CreateExp!) {
    exp(exp: $exp) {
      ...ExpFrag
    }
  }

  ${expFrag}
`;

export default createExpMutation;

export type ExpMutationFn = MutationFn<
  CreateExpMutation,
  CreateExpMutationVariables
>;

export interface CreateExpMutationProps {
  createExp?: ExpMutationFn;
}

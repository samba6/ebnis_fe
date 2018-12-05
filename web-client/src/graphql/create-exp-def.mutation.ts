import gql from "graphql-tag";
import { MutationFn } from "react-apollo";

import { ExpDefMutation, ExpDefMutationVariables } from "./apollo-gql";

export const expDefMutation = gql`
  mutation ExpDefMutation($expDef: CreateExpDef!) {
    expDef(expDef: $expDef) {
      id
    }
  }
`;

export default expDefMutation;

export type ExpDefMutationFn = MutationFn<
  ExpDefMutation,
  ExpDefMutationVariables
>;

export interface ExpDefMutationProps {
  createExperience?: ExpDefMutationFn;
}

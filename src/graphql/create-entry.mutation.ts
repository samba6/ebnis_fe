import gql from "graphql-tag";
import { MutationFn } from "react-apollo";

import {
  CreateEntryMutation,
  CreateEntryMutationVariables
} from "./apollo-types/CreateEntryMutation";
import { ENTRY_FRAGMENT } from "./entry.fragment";

export const CREATE_ENTRY_MUTATION = gql`
  mutation CreateEntryMutation($input: CreateEntryInput!) {
    createEntry(input: $input) {
      ...EntryFragment
    }
  }

  ${ENTRY_FRAGMENT}
`;

export type CreateEntryMutationFn = MutationFn<
  CreateEntryMutation,
  CreateEntryMutationVariables
>;

export interface CreateEntryMutationProps {
  createEntry?: CreateEntryMutationFn;
}

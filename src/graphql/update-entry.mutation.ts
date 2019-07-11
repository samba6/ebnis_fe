import gql from "graphql-tag";
import { ENTRY_FRAGMENT } from "./entry.fragment";
import {
  UpdateEntryMutation,
  UpdateEntryMutationVariables,
} from "./apollo-types/UpdateEntryMutation";
import { MutationFn } from "react-apollo";

export const UPDATE_ENTRY_MUTATION = gql`
  mutation UpdateEntryMutation($input: UpdateEntryInput!) {
    updateEntry(input: $input) {
      entry {
        ...EntryFragment
      }

      fieldsErrors {
        defId

        error {
          data
          defId
        }
      }
    }
  }

  ${ENTRY_FRAGMENT}
`;

export type UpdateEntryMutationFn = MutationFn<
  UpdateEntryMutation,
  UpdateEntryMutationVariables
>;

export interface UpdateEntryMutationProps {
  updateEntry: UpdateEntryMutationFn;
}

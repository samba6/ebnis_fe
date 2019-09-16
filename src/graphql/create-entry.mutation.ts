import gql from "graphql-tag";
import {
  CreateEntryMutation,
  CreateEntryMutationVariables,
} from "./apollo-types/CreateEntryMutation";
import { ENTRY_FRAGMENT } from "./entry.fragment";
import { DATA_OBJECTS_ERRORS } from "./data-objects-errors-fragment";
import { MutationFunction } from "react-apollo";

const CREATE_ENTRY_ERRORS_FRAGMENT = gql`
  fragment CreateEntryErrorsFragment on CreateEntryErrors {
    clientId
    entry
    experience
    experienceId

    dataObjectsErrors {
      ...DataObjectsErrorsFragment
    }
  }

  ${DATA_OBJECTS_ERRORS}
`;

export const CREATE_ENTRY_MUTATION = gql`
  mutation CreateEntryMutation($input: CreateEntryInput!) {
    createEntry(input: $input) {
      entry {
        ...EntryFragment
      }

      errors {
        ...CreateEntryErrorsFragment
      }
    }
  }

  ${ENTRY_FRAGMENT}
  ${CREATE_ENTRY_ERRORS_FRAGMENT}
`;

export type CreateEntryMutationFn = MutationFunction<
  CreateEntryMutation,
  CreateEntryMutationVariables
>;

export interface CreateEntryMutationProps {
  createEntry?: CreateEntryMutationFn;
}

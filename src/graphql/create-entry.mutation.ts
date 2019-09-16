import gql from "graphql-tag";
import { ENTRY_FRAGMENT } from "./entry.fragment";
import { DATA_OBJECTS_ERRORS } from "./data-objects-errors-fragment";

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


import gql from "graphql-tag";

import { ENTRY_FRAGMENT } from "./entry.fragment";
import { DATA_OBJECTS_ERRORS } from "./data-objects-errors-fragment";

export const CREATE_ENTRIES_ERROR_FRAGMENT = gql`
  fragment CreateEntriesErrorsFragment on CreateEntriesErrors {
    experienceId
    clientId
    errors {
      clientId
      entry
      experienceId
      experience
      dataObjectsErrors {
        ...DataObjectsErrorsFragment
      }
    }
  }

  ${DATA_OBJECTS_ERRORS}
`;

export const CREATE_ENTRIES_RESPONSE_FRAGMENT = gql`
  fragment CreateEntriesResponseFragment on CreateEntriesResponse {
    experienceId

    entries {
      ...EntryFragment
    }

    errors {
      ...CreateEntriesErrorsFragment
    }
  }

  ${ENTRY_FRAGMENT}
  ${CREATE_ENTRIES_ERROR_FRAGMENT}
`;

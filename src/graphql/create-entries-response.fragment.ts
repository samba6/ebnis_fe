import gql from "graphql-tag";

import { ENTRY_FRAGMENT } from "./entry.fragment";

export const CREATE_ENTRIES_ERROR_FRAGMENT = gql`
  fragment CreateEntriesErrorFragment on CreateEntriesError {
    experienceId
    clientId
    error
  }
`;

export const CREATE_ENTRIES_RESPONSE_FRAGMENT = gql`
  fragment CreateEntriesResponseFragment on CreateEntriesResponse {
    experienceId

    entries {
      ...EntryFragment
    }

    errors {
      ...CreateEntriesErrorFragment
    }
  }

  ${ENTRY_FRAGMENT}
  ${CREATE_ENTRIES_ERROR_FRAGMENT}
`;

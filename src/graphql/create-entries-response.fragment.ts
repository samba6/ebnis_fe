import gql from "graphql-tag";

import { ENTRY_FRAGMENT } from "./entry.fragment";

export const CREATE_ENTRIES_RESPONSE_FRAGMENT = gql`
  fragment CreateEntriesResponseFragment on CreateEntriesResponse {
    expId

    entries {
      ...EntryFragment
    }

    errors {
      clientId
      error
    }
  }

  ${ENTRY_FRAGMENT}
`;

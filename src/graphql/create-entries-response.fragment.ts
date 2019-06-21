import gql from "graphql-tag";

import { ENTRY_FRAGMENT } from "./entry.fragment";

export const CREATE_ENTRIES_RESPONSE_FRAGMENT = gql`
  fragment CreateEntriesResponseFragment on CreateEntriesResponse {
    successes {
      expId
      entries {
        ...EntryFragment
      }
    }

    failures {
      clientId
      error
    }
  }

  ${ENTRY_FRAGMENT}
`;

import gql from "graphql-tag";

import { ENTRY_FRAGMENT } from "./entry.fragment";

export const CREATE_ENTRIES_RESPONSE_FRAGMENT = gql`
  fragment CreateEntriesResponseFragment on CreateEntriesResponse {
    successes {
      index
      entry {
        ...EntryFragment
      }
    }

    failures {
      index
      error
    }
  }

  ${ENTRY_FRAGMENT}
`;

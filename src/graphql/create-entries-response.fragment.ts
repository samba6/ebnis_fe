import gql from "graphql-tag";

import { entryFrag } from "./entry.frag";

export const CREATE_ENTRIES_RESPONSE_FRAGMENT = gql`
  fragment CreateEntriesResponseFragment on CreateEntriesResponse {
    successes {
      index
      entry {
        ...EntryFrag
      }
    }

    failures {
      index
      error
    }
  }

  ${entryFrag}
`;

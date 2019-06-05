import gql from "graphql-tag";
import { ENTRY_FRAGMENT } from "./entry.fragment";

export const ENTRY_CONNECTION_FRAGMENT = gql`
  fragment EntryConnectionFragment on EntryConnection {
    pageInfo {
      hasNextPage
      hasPreviousPage
    }

    edges {
      cursor
      node {
        ...EntryFragment
      }
    }
  }

  ${ENTRY_FRAGMENT}
`;

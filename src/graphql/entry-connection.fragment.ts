import gql from "graphql-tag";
import { ENTRY_RELAY_FRAGMENT } from "./entry-relay.fragment";

export const ENTRY_CONNECTION_FRAGMENT = gql`
  fragment EntryConnectionFragment on EntryRelayConnection {
    pageInfo {
      hasNextPage
      hasPreviousPage
    }

    edges {
      cursor
      node {
        ...EntryRelayFragment
      }
    }
  }

  ${ENTRY_RELAY_FRAGMENT}
`;

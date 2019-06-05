import gql from "graphql-tag";

export const ENTRY_RELAY_FRAGMENT = gql`
  fragment EntryRelayFragment on EntryRelay {
    _id
    id
    expId
    fields {
      defId
      data
    }
    insertedAt
  }
`;

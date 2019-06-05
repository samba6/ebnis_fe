import gql from "graphql-tag";

export const ENTRY_FRAGMENT = gql`
  fragment EntryFragment on Entry {
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

import gql from "graphql-tag";

export const ENTRY_FRAGMENT = gql`
  fragment EntryFragment on Entry {
    id
    expId
    clientId
    insertedAt
    updatedAt

    fields {
      defId
      data
    }
  }
`;

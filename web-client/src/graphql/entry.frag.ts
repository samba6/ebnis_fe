import gql from "graphql-tag";

export const entryFrag = gql`
  fragment EntryFrag on Entry {
    id
    expId
    fields {
      defId
      data
    }
    insertedAt
  }
`;

export default entryFrag;

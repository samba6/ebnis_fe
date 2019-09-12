import gql from "graphql-tag";

export const DATA_OBJECT_FRAGMENT = gql`
  fragment DataObjectFragment on DataObject {
    id
    data
    definitionId
    clientId
    insertedAt
    updatedAt
  }
`;

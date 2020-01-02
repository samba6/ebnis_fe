import gql from "graphql-tag";

export const DATA_OBJECTS_ERRORS = gql`
  fragment DataObjectsErrorsFragment on DataObjectsErrors {
    index
    clientId
    errors {
      data
      definition
      definitionId
    }
  }
`;

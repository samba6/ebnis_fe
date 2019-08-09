import gql from "graphql-tag";

export const DATA_OBJECTS_ERRORS = gql`
  fragment DataObjectsErrorsFragment on DataObjectsErrors {
    index
    errors {
      data
      definition
      definitionId
    }
  }
`;

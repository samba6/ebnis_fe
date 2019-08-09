import gql from "graphql-tag";

export const DATA_DEFINITIONS_ERRORS = gql`
  fragment DataDefinitionsErrorsFragment on DataDefinitionErrors {
    index
    errors {
      name
      type
    }
  }
`;

export const CREATE_EXPERIENCE_ERRORS = gql`
  fragment CreateExperienceErrorsFragment on CreateExperienceErrors {
    clientId
    title
    user
    dataDefinitionsErrors {
      ...DataDefinitionsErrorsFragment
    }
  }

  ${DATA_DEFINITIONS_ERRORS}
`;

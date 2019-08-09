import gql from "graphql-tag";

export const DATA_DEFINITION_FRAGMENT = gql`
  fragment DataDefinitionFragment on DataDefinition {
    id
    name
    type
    clientId
  }
`;

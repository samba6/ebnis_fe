import gql from "graphql-tag";

export const DEFINITION_FRAGMENT = gql`
  fragment DataDefinitionFragment on DataDefinition {
    id
    name
    type
    clientId
  }
`;

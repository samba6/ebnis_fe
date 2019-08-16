import gql from "graphql-tag";
import { DEFINITION_FRAGMENT } from "./data-definition.fragment";

export const UPDATE_DEFINITIONS_MUTATION = gql`
  mutation UpdateDefinitions($input: [UpdateDefinitionsInput!]!) {
    updateDefinitions(input: $input) {
      experience {
        id
        updatedAt
      }

      definitions {
        ...DefinitionFragment
        errors {
          id
          errors {
            definition
            name
          }
        }
      }
    }
  }
  ${DEFINITION_FRAGMENT}
`;

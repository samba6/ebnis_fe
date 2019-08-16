import gql from "graphql-tag";
import { DEFINITION_FRAGMENT } from "./data-definition.fragment";
import { MutationFn } from "react-apollo";
import {
  UpdateDefinitions,
  UpdateDefinitionsVariables,
} from "./apollo-types/UpdateDefinitions";

export const UPDATE_DEFINITIONS_MUTATION = gql`
  mutation UpdateDefinitions($input: [UpdateDefinitionInput!]!) {
    updateDefinitions(input: $input) {
      experience {
        id
        updatedAt
      }

      definitions {
        definition {
          ...DataDefinitionFragment
        }

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

export type UpdateDefinitionsMutationFn = MutationFn<
  UpdateDefinitions,
  UpdateDefinitionsVariables
>;

export interface UpdateDefinitionsMutationProps {
  updateDefinitionsOnline: UpdateDefinitionsMutationFn;
}

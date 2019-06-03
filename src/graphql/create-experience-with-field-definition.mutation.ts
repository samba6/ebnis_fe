import gql from "graphql-tag";

import { expFrag } from "./exp.fragment";
import { fieldDefFrag } from "./field-def.fragment";

export const CREATE_EXPERIENCE_WITH_FIELD_DEFINITION_MUTATION = gql`
  mutation CreateExperienceWithFieldDefinitionMutation($exp: CreateExp!) {
    exp(exp: $exp) {
      ...ExpFrag

      fieldDefs {
        ...FieldDefFrag
      }
    }
  }

  ${expFrag}
  ${fieldDefFrag}
`;

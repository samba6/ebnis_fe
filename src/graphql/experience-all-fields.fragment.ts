import gql from "graphql-tag";
import { expFrag } from "./exp.fragment";
import { fieldDefFrag } from "./field-def.fragment";

export const EXPERIENCE_ALL_FIELDS_FRAGMENT = gql`
  fragment ExperienceAllFieldsFragment on Experience {
    ...ExpFrag

    fieldDefs {
      ...FieldDefFrag
    }
  }

  ${expFrag}
  ${fieldDefFrag}
`;

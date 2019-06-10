import gql from "graphql-tag";
import { expFrag } from "./exp.fragment";
import { fieldDefFrag } from "./field-def.fragment";
import { ENTRY_CONNECTION_FRAGMENT } from "./entry-connection.fragment";

export const EXPERIENCE_ALL_FIELDS_FRAGMENT = gql`
  fragment ExperienceAllFieldsFragment on Experience {
    ...ExpFrag

    fieldDefs {
      ...FieldDefFrag
    }

    entries {
      ...EntryConnectionFragment
    }
  }

  ${expFrag}
  ${fieldDefFrag}
  ${ENTRY_CONNECTION_FRAGMENT}
`;

import gql from "graphql-tag";
import { FIELD_DEF_FRAGMENT } from "./field-def.fragment";

export const EXPERIENCE_NO_ENTRY_FRAGMENT = gql`
  fragment ExperienceNoEntryFragment on Experience {
    id
    title
    description
    clientId
    insertedAt
    updatedAt

    fieldDefs {
      ...FieldDefFragment
    }
  }

  ${FIELD_DEF_FRAGMENT}
`;

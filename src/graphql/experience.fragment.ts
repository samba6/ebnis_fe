import gql from "graphql-tag";
import { FIELD_DEF_FRAGMENT } from "./field-def.fragment";
import { ENTRY_CONNECTION_FRAGMENT } from "./entry-connection.fragment";

export const EXPERIENCE_FRAGMENT = gql`
  fragment ExperienceFragment on Experience {
    id
    title
    description
    clientId
    fieldDefs {
      ...FieldDefFragment
    }

    entries(pagination: $pagination) {
      ...EntryConnectionFragment
    }
  }

  ${FIELD_DEF_FRAGMENT}
  ${ENTRY_CONNECTION_FRAGMENT}
`;

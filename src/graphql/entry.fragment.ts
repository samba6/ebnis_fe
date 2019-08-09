import gql from "graphql-tag";
import { DATA_OBJECT_FRAGMENT } from "./data-object-fragment";

export const ENTRY_FRAGMENT = gql`
  fragment EntryFragment on Entry {
    id
    experienceId
    clientId
    insertedAt
    updatedAt

    dataObjects {
      ...DataObjectFragment
    }
  }

  ${DATA_OBJECT_FRAGMENT}
`;

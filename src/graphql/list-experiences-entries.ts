import gql from "graphql-tag";
import { DataValue } from "react-apollo";

import {
  ListExperiencesEntries,
  ListExperiencesEntriesVariables
} from "./apollo-types/ListExperiencesEntries";
import { ENTRY_CONNECTION_FRAGMENT } from "./entry-connection.fragment";

export const LIST_EXPERIENCES_ENTRIES = gql`
  query ListExperiencesEntries($input: ListExperiencesEntriesInput!) {
    listExperiencesEntries(input: $input) {
      ...EntryConnectionFragment
    }
  }

  ${ENTRY_CONNECTION_FRAGMENT}
`;

export type ListExperiencesEntriesData = DataValue<
  ListExperiencesEntries,
  ListExperiencesEntriesVariables
>;

export interface ListExperiencesEntriesProps {
  listExperiencesEntriesProps: ListExperiencesEntriesData;
}

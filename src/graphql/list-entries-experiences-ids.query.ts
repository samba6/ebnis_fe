import gql from "graphql-tag";
import { DataValue } from "react-apollo";

import {
  ListEntriesFromExperiencesIds,
  ListEntriesFromExperiencesIdsVariables
} from "./apollo-types/ListEntriesFromExperiencesIds";
import { ENTRY_CONNECTION_FRAGMENT } from "./entry-connection.fragment";

export const LIST_ENTRIES_FROM_EXPERIENCES_IDS = gql`
  query ListEntriesFromExperiencesIds(
    $input: ListEntriesFromExperiencesIdsInput!
  ) {
    listEntriesFromExperiencesIds(input: $input) {
      expId

      entryConnection {
        ...EntryConnectionFragment
      }
    }
  }

  ${ENTRY_CONNECTION_FRAGMENT}
`;

export type ListEntriesFromExperiencesIdsData = DataValue<
  ListEntriesFromExperiencesIds,
  ListEntriesFromExperiencesIdsVariables
>;

export interface ListEntriesFromExperiencesIdsProps {
  listEntriesFromExperiencesIdsProps: ListEntriesFromExperiencesIdsData;
}

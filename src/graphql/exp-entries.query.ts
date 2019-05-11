import gql from "graphql-tag";
import { DataValue } from "react-apollo";

import {
  GetExpAllEntries,
  GetExpAllEntriesVariables
} from "./apollo-types/GetExpAllEntries";
import { entryFrag } from "./entry.frag";

export const GET_EXP_ENTRIES_QUERY = gql`
  query GetExpAllEntries($entry: GetExpEntries!) {
    expEntries(entry: $entry) {
      ...EntryFrag
    }
  }

  ${entryFrag}
`;

export type GetExpEntriesGqlProps = DataValue<
  GetExpAllEntries,
  GetExpAllEntriesVariables
>;

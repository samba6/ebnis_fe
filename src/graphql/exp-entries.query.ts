import gql from "graphql-tag";
import { DataValue } from "react-apollo";

import { GetExpAllEntries, GetExpAllEntriesVariables } from "./apollo-gql";
import { entryFrag } from "./entry.frag";

export const getExpEntries = gql`
  query GetExpAllEntries($entry: GetExpEntries!) {
    expEntries(entry: $entry) {
      ...EntryFrag
    }
  }

  ${entryFrag}
`;

export default getExpEntries;

export type GetExpEntriesGqlProps = DataValue<
  GetExpAllEntries,
  GetExpAllEntriesVariables
>;

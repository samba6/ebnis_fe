import gql from "graphql-tag";
import { MutationFn } from "react-apollo";

import { entryFrag } from "./entry.frag";
import { CreateAnEntry, CreateAnEntryVariables } from "./apollo-gql.d";

export const createEntry = gql`
  mutation CreateAnEntry($entry: CreateEntry!) {
    entry(entry: $entry) {
      ...EntryFrag
    }
  }

  ${entryFrag}
`;

export default createEntry;

export type CreateEntryFn = MutationFn<CreateAnEntry, CreateAnEntryVariables>;

export interface CreateEntryGqlProps {
  createEntry?: CreateEntryFn;
}

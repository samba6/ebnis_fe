import gql from "graphql-tag";
import { MutationFn } from "react-apollo";

import { entryFrag } from "./entry.frag";
import {
  CreateAnEntry,
  CreateAnEntryVariables
} from "./apollo-types/CreateAnEntry";

export const CREATE_ENTRY_MUTATION = gql`
  mutation CreateAnEntry($entry: CreateEntry!) {
    entry(entry: $entry) {
      ...EntryFrag
    }
  }

  ${entryFrag}
`;

export type CreateEntryFn = MutationFn<CreateAnEntry, CreateAnEntryVariables>;

export interface CreateEntryGqlProps {
  createEntry?: CreateEntryFn;
}

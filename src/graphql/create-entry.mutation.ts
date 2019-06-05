import gql from "graphql-tag";
import { MutationFn } from "react-apollo";

import {
  CreateAnEntry,
  CreateAnEntryVariables
} from "./apollo-types/CreateAnEntry";
import { ENTRY_RELAY_FRAGMENT } from "./entry-relay.fragment";

export const CREATE_ENTRY_MUTATION = gql`
  mutation CreateAnEntry($entry: CreateEntry!) {
    entry(entry: $entry) {
      ...EntryRelayFragment
    }
  }

  ${ENTRY_RELAY_FRAGMENT}
`;

export type CreateEntryFn = MutationFn<CreateAnEntry, CreateAnEntryVariables>;

export interface CreateEntryGqlProps {
  createEntry?: CreateEntryFn;
}

import gql from "graphql-tag";
import { MutationFn } from "react-apollo";

import { CREATE_ENTRIES_RESPONSE_FRAGMENT } from "./create-entries-response.fragment";
import {
  CreateEntriesMutation,
  CreateEntriesMutationVariables,
} from "./apollo-types/CreateEntriesMutation";

export const CREATE_ENTRIES_MUTATION = gql`
  mutation CreateEntriesMutation($createEntries: [CreateEntryInput!]!) {
    createEntries(createEntries: $createEntries) {
      ...CreateEntriesResponseFragment
    }
  }

  ${CREATE_ENTRIES_RESPONSE_FRAGMENT}
`;

export type CreateEntriesMutationFn = MutationFn<
  CreateEntriesMutation,
  CreateEntriesMutationVariables
>;

export interface CreateEntriesMutationGqlProps {
  createEntries: CreateEntriesMutationFn;
}

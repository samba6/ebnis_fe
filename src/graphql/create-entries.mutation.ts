import gql from "graphql-tag";
import { CREATE_ENTRIES_RESPONSE_FRAGMENT } from "./create-entries-response.fragment";
import {
  CreateEntriesMutation,
  CreateEntriesMutationVariables,
} from "./apollo-types/CreateEntriesMutation";
import { MutationFunction } from "react-apollo";

export const CREATE_ENTRIES_MUTATION = gql`
  mutation CreateEntriesMutation($input: [CreateEntriesInput!]!) {
    createEntries(input: $input) {
      ...CreateEntriesResponseFragment
    }
  }

  ${CREATE_ENTRIES_RESPONSE_FRAGMENT}
`;

export type CreateEntriesMutationFn = MutationFunction<
  CreateEntriesMutation,
  CreateEntriesMutationVariables
>;

export interface CreateEntriesMutationGqlProps {
  createEntries: CreateEntriesMutationFn;
}

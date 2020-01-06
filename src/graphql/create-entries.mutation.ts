import gql from "graphql-tag";
import { CREATE_ENTRIES_RESPONSE_FRAGMENT } from "./create-entries-response.fragment";
import { useMutation } from "@apollo/react-hooks";
import {
  MutationFunction,
  MutationFunctionOptions,
  MutationResult,
} from "@apollo/react-common";
import {
  CreateEntriesMutation,
  CreateEntriesMutationVariables,
} from "./apollo-types/CreateEntriesMutation";

export const CREATE_ENTRIES_MUTATION = gql`
  mutation CreateEntriesMutation($input: [CreateEntriesInput!]!) {
    createEntries(input: $input) {
      ...CreateEntriesResponseFragment
    }
  }

  ${CREATE_ENTRIES_RESPONSE_FRAGMENT}
`;

export function useCreateEntriesMutation(): UseCreateEntriesMutation {
  return useMutation(CREATE_ENTRIES_MUTATION);
}

type UseCreateEntriesMutationFn = MutationFunction<
  CreateEntriesMutation,
  CreateEntriesMutationVariables
>;

// use to type check server response
type UseCreateEntriesMutationResult = MutationResult<
  CreateEntriesMutation
>;

// component props should extend this
export interface UseCreateEntriesMutationProps {
  createEntries: UseCreateEntriesMutationFn;
}

type UseCreateEntriesMutation = [
  UseCreateEntriesMutationFn,
  UseCreateEntriesMutationResult,
];

// used to type check test mock calls
type UseCreateEntriesMutationFnOptions = MutationFunctionOptions<
  CreateEntriesMutation,
  CreateEntriesMutationVariables
>;

import gql from "graphql-tag";
import { useMutation } from "@apollo/react-hooks";
import {
  MutationFunction,
  MutationFunctionOptions,
  MutationResult,
} from "@apollo/react-common";
import { ENTRY_FRAGMENT } from "./entry.fragment";
import { DATA_OBJECTS_ERRORS } from "./data-objects-errors-fragment";
import {
  CreateOnlineEntryMutation,
  CreateOnlineEntryMutationVariables,
} from "./apollo-types/CreateOnlineEntryMutation";

const CREATE_ENTRY_ERRORS_FRAGMENT = gql`
  fragment CreateEntryErrorsFragment on CreateEntryErrors {
    clientId
    entry
    experience
    experienceId
    dataObjectsErrors {
      ...DataObjectsErrorsFragment
    }
  }

  ${DATA_OBJECTS_ERRORS}
`;

export const CREATE_ONLINE_ENTRY_MUTATION = gql`
  mutation CreateOnlineEntryMutation($input: CreateEntryInput!) {
    createEntry(input: $input) {
      entry {
        ...EntryFragment
      }
      errors {
        ...CreateEntryErrorsFragment
      }
    }
  }

  ${ENTRY_FRAGMENT}
  ${CREATE_ENTRY_ERRORS_FRAGMENT}
`;

export const MUTATION_NAME_createEntry = "createEntry";

export function useCreateOnlineEntryMutation(): UseCreateOnlineEntryMutation {
  return useMutation(CREATE_ONLINE_ENTRY_MUTATION);
}

export type CreateOnlineEntryMutationFn = MutationFunction<
  CreateOnlineEntryMutation,
  CreateOnlineEntryMutationVariables
>;

// used to type check test mock calls
export type CreateOnlineEntryMutationFnOptions = MutationFunctionOptions<
  CreateOnlineEntryMutation,
  CreateOnlineEntryMutationVariables
>;

export type UseCreateOnlineEntryMutation = [
  CreateOnlineEntryMutationFn,
  CreateEntryOnlineMutationResult,
];

// use to type check server response
export type CreateEntryOnlineMutationResult = MutationResult<
  CreateOnlineEntryMutation
>;

// component's props should extend this
export interface CreateOnlineEntryMutationComponentProps {
  createOnlineEntry: CreateOnlineEntryMutationFn;
}

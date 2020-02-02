import gql from "graphql-tag";
import { useMutation } from "@apollo/react-hooks";
import {
  MutationFunction,
  MutationFunctionOptions,
  MutationResult,
  ExecutionResult,
} from "@apollo/react-common";
import {
  DeleteExperiences,
  DeleteExperiencesVariables,
} from "./apollo-types/DeleteExperiences";

export const DELETE_EXPERIENCES_MUTATION = gql`
  mutation DeleteExperiences($input: [ID!]!) {
    deleteExperiences(input: $input) {
      ... on DeleteExperiencesAllFail {
        error
      }
      ... on DeleteExperiencesSomeSuccess {
        experiences {
          ... on DeleteExperienceErrors {
            errors {
              id
              error
            }
          }
          ... on DeleteExperienceSuccess {
            experience {
              id
            }
          }
        }
      }
    }
  }
`;

export function useDeleteExperiencesMutation(): UseDeleteExperiencesMutation {
  return useMutation(DELETE_EXPERIENCES_MUTATION);
}

export type DeleteExperiencesMutationFn = MutationFunction<
  DeleteExperiences,
  DeleteExperiencesVariables
>;

// used to type check test fake mutation function return value e.g. {data: {result: {}}}
export type DeleteExperiencesMutationResult = ExecutionResult<
  DeleteExperiences
>;

// used to type check test fake function calls arguments
export type DeleteExperiencesMutationFnOptions = MutationFunctionOptions<
  DeleteExperiences,
  DeleteExperiencesVariables
>;

export type UseDeleteExperiencesMutation = [
  DeleteExperiencesMutationFn,
  MutationResult<DeleteExperiences>,
];

// component's props should extend this
export interface DeleteExperiencesComponentProps {
  deleteExperiences: DeleteExperiencesMutationFn;
}

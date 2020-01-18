/* eslint-disable react-hooks/rules-of-hooks*/
import gql from "graphql-tag";
import { EXPERIENCE_FRAGMENT } from "./experience.fragment";
import { DATA_DEFINITIONS_ERRORS } from "./create-experience-errors.fragment";
import { useMutation } from "@apollo/react-hooks";
import {
  MutationFunction,
  MutationFunctionOptions,
  MutationResult,
} from "@apollo/react-common";
import {
  CreateExperienceMutation,
  CreateExperienceMutationVariables,
} from "./apollo-types/CreateExperienceMutation";

export const CREATE_EXPERIENCE_MUTATION = gql`
  mutation CreateExperienceMutation(
    $createExperienceInput: CreateExperienceInput!
    $entriesPagination: PaginationInput!
  ) {
    createExperience(input: $createExperienceInput) {
      experience {
        ...ExperienceFragment
      }

      errors {
        clientId
        title
        user
        dataDefinitionsErrors {
          ...DataDefinitionsErrorsFragment
        }
      }
    }
  }

  ${EXPERIENCE_FRAGMENT}
  ${DATA_DEFINITIONS_ERRORS}
`;

export function useCreateExperienceOnline(): UsemutationCreateExperienceOnlineMutation {
  return useMutation(CREATE_EXPERIENCE_MUTATION);
}

export type CreateExperienceOnlineMutationFn = MutationFunction<
  CreateExperienceMutation,
  CreateExperienceMutationVariables
>;

// used to type check test mock calls
export type CreateExperienceOnlineMutationFnOptions = MutationFunctionOptions<
  CreateExperienceMutation,
  CreateExperienceMutationVariables
>;

export type UsemutationCreateExperienceOnlineMutation = [
  CreateExperienceOnlineMutationFn,
  MutationResult<CreateExperienceMutation>,
];

// component's props should extend this
export interface CreateExperienceOnlineMutationComponentProps {
  createExperienceOnline: CreateExperienceOnlineMutationFn;
}

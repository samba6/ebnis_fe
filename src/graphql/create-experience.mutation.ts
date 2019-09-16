import gql from "graphql-tag";
import {
  CreateExperienceMutation,
  CreateExperienceMutationVariables,
} from "./apollo-types/CreateExperienceMutation";
import { EXPERIENCE_FRAGMENT } from "./experience.fragment";
import { DATA_DEFINITIONS_ERRORS } from "./create-experience-errors.fragment";
import { MutationFunction } from "react-apollo";

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

export type CreateExperienceMutationFn = MutationFunction<
  CreateExperienceMutation,
  CreateExperienceMutationVariables
>;

export interface CreateExperienceMutationProps {
  createExperience?: CreateExperienceMutationFn;
}

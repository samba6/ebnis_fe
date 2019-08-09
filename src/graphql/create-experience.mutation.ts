import gql from "graphql-tag";
import { MutationFn } from "react-apollo";

import {
  CreateExperienceMutation,
  CreateExperienceMutationVariables,
} from "./apollo-types/CreateExperienceMutation";
import { EXPERIENCE_FRAGMENT } from "./experience.fragment";
import { DATA_DEFINITIONS_ERRORS } from "./create-experience-errors.fragment";

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

export type CreateExperienceMutationFn = MutationFn<
  CreateExperienceMutation,
  CreateExperienceMutationVariables
>;

export interface CreateExperienceMutationProps {
  createExperience?: CreateExperienceMutationFn;
}

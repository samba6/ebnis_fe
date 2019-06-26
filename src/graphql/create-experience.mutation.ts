import gql from "graphql-tag";
import { MutationFn } from "react-apollo";

import {
  CreateExperienceMutation,
  CreateExperienceMutationVariables
} from "./apollo-types/CreateExperienceMutation";
import { EXPERIENCE_FRAGMENT } from "./experience.fragment";

export const CREATE_EXPERIENCE_MUTATION = gql`
  mutation CreateExperienceMutation(
    $createExperienceInput: CreateExperienceInput!
    $entriesPagination: PaginationInput
  ) {
    createExperience(input: $createExperienceInput) {
      ...ExperienceFragment
    }
  }

  ${EXPERIENCE_FRAGMENT}
`;

export type CreateExperienceMutationFn = MutationFn<
  CreateExperienceMutation,
  CreateExperienceMutationVariables
>;

export interface CreateExperienceMutationProps {
  createExperience?: CreateExperienceMutationFn;
}

import gql from "graphql-tag";
import { MutationFn } from "react-apollo";

import {
  CreateExperienceMutation,
  CreateExperienceMutationVariables
} from "./apollo-types/CreateExperienceMutation";
import { CREATE_EXPERIENCE_FRAGMENT } from "./create-experience.fragment";

export const CREATE_EXPERIENCE_MUTATION = gql`
  mutation CreateExperienceMutation($input: CreateExperienceInput!) {
    createExperience(input: $input) {
      ...CreateExperienceFragment
    }
  }

  ${CREATE_EXPERIENCE_FRAGMENT}
`;

export type CreateExperienceMutationFn = MutationFn<
  CreateExperienceMutation,
  CreateExperienceMutationVariables
>;

export interface CreateExperienceMutationProps {
  createExperience?: CreateExperienceMutationFn;
}

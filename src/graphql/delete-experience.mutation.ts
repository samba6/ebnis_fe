import gql from "graphql-tag";
import { EXPERIENCE_NO_ENTRY_FRAGMENT } from "./experience.fragment";
import {
  DeleteExperienceMutation,
  DeleteExperienceMutationVariables,
} from "./apollo-types/DeleteExperienceMutation";
import { MutationFunction } from "react-apollo";

export const DELETE_EXPERIENCE_MUTATION = gql`
  mutation DeleteExperienceMutation($id: ID!) {
    deleteExperience(id: $id) {
      ...ExperienceNoEntryFragment
    }
  }

  ${EXPERIENCE_NO_ENTRY_FRAGMENT}
`;

export type DeleteExperienceMutationFn = MutationFunction<
  DeleteExperienceMutation,
  DeleteExperienceMutationVariables
>;

export interface DeleteExperienceMutationProps {
  createExperience?: DeleteExperienceMutationFn;
}

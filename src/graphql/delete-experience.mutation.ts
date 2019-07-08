import gql from "graphql-tag";
import { EXPERIENCE_NO_ENTRY_FRAGMENT } from "./experience.fragment";
import { MutationFn } from "react-apollo";
import {
  DeleteExperienceMutation,
  DeleteExperienceMutationVariables,
} from "./apollo-types/DeleteExperienceMutation";

export const DELETE_EXPERIENCE_MUTATION = gql`
  mutation DeleteExperienceMutation($id: ID!) {
    deleteExperience(id: $id) {
      ...ExperienceNoEntryFragment
    }
  }

  ${EXPERIENCE_NO_ENTRY_FRAGMENT}
`;

export type DeleteExperienceMutationFn = MutationFn<
  DeleteExperienceMutation,
  DeleteExperienceMutationVariables
>;

export interface DeleteExperienceMutationProps {
  createExperience?: DeleteExperienceMutationFn;
}

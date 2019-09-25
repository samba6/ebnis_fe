import gql from "graphql-tag";
import { EXPERIENCE_NO_ENTRY_FRAGMENT } from "./experience.fragment";
import {
  UpdateExperienceMutation,
  UpdateExperienceMutationVariables,
} from "./apollo-types/UpdateExperienceMutation";
import { MutationFunction } from "@apollo/react-common";

export const UPDATE_EXPERIENCE_MUTATION = gql`
  mutation UpdateExperienceMutation($input: UpdateExperienceInput!) {
    updateExperience(input: $input) {
      experience {
        ...ExperienceNoEntryFragment
      }

      errors {
        title
        clientId
      }
    }
  }

  ${EXPERIENCE_NO_ENTRY_FRAGMENT}
`;

export type UpdateExperienceMutationFn = MutationFunction<
  UpdateExperienceMutation,
  UpdateExperienceMutationVariables
>;

export interface UpdateExperienceMutationProps {
  updateExperience: UpdateExperienceMutationFn;
}

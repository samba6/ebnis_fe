import gql from "graphql-tag";
import { MutationFn } from "react-apollo";

import { expFieldFragment } from "./exp-field.fragment";
import { experienceFragment } from "./experience.fragment";
import { ExperienceMutation, ExperienceMutationVariables } from "./apollo-gql";

export const experienceMutation = gql`
  mutation ExperienceMutation($experience: CreateExperience!) {
    experience(experience: $experience) {
      ...ExperienceFragment
      fields {
        ...ExpFieldFragment
      }
    }
  }

  ${experienceFragment}
  ${expFieldFragment}
`;

export default experienceMutation;

export type ExperienceMutationFn = MutationFn<
  ExperienceMutation,
  ExperienceMutationVariables
>;

export interface ExperienceMutationProps {
  createExperience?: ExperienceMutationFn;
}

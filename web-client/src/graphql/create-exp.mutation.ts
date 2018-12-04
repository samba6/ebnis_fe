import gql from "graphql-tag";
import { MutationFn } from "react-apollo";

import { ExperienceMutation, ExperienceMutationVariables } from "./apollo-gql";

export const experienceMutation = gql`
  mutation ExperienceMutation($experience: CreateExperience!) {
    experience(experience: $experience) {
      id
    }
  }
`;

export default experienceMutation;

export type ExperienceMutationFn = MutationFn<
  ExperienceMutation,
  ExperienceMutationVariables
>;

export interface ExperienceMutationProps {
  createExperience?: ExperienceMutationFn;
}

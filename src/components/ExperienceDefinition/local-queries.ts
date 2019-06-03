import gql from "graphql-tag";
import { graphql } from "react-apollo";
import { MutationFn } from "react-apollo";
import { CreateExpMutationVariables } from "../../graphql/apollo-types/CreateExpMutation";
import { EXPERIENCE_ALL_FIELDS_FRAGMENT } from "../../graphql/experience-all-fields.fragment";
import { ExperienceAllFieldsFragment } from "../../graphql/apollo-types/ExperienceAllFieldsFragment";

export const CREATE_UNSAVED_EXPERIENCE_MUTATION = gql`
  mutation CreateUnsavedExperienceMutation($exp: CreateExperience!) {
    createUnsavedExperience(exp: $exp) @client {
      ...ExperienceAllFieldsFragment
    }
  }

  ${EXPERIENCE_ALL_FIELDS_FRAGMENT}
`;

interface CreateUnsavedExperienceMutationData {
  createUnsavedExperience: ExperienceAllFieldsFragment;
}

type Fn = MutationFn<
  CreateUnsavedExperienceMutationData,
  CreateExpMutationVariables
>;

export interface CreateUnsavedExperienceMutationProps {
  createUnsavedExperience: Fn;
}

export const createUnsavedExperienceGql = graphql<
  {},
  CreateUnsavedExperienceMutationData,
  CreateExpMutationVariables,
  CreateUnsavedExperienceMutationProps | undefined
>(CREATE_UNSAVED_EXPERIENCE_MUTATION, {
  props: ({ mutate }) =>
    mutate && {
      createUnsavedExperience: mutate
    }
});

import { mutate, persistCache } from "./mutate";
import { CreateExperienceInput } from "../../src/graphql/apollo-types/globalTypes";
import { CREATE_EXPERIENCE_MUTATION } from "../../src/graphql/create-experience.mutation";
import {
  CreateExperienceMutation,
  CreateExperienceMutationVariables,
} from "../../src/graphql/apollo-types/CreateExperienceMutation";
import { ExperienceFragment } from "../../src/graphql/apollo-types/ExperienceFragment";
import {
  CreateUnsavedExperienceMutationData,
  CREATE_UNSAVED_EXPERIENCE_MUTATION,
} from "../../src/components/ExperienceDefinition/resolvers";

export function createSavedExperience(
  experienceDefinitionArgs: CreateExperienceInput,
  { persist }: { persist?: boolean } = {},
) {
  return mutate<CreateExperienceMutation, CreateExperienceMutationVariables>({
    mutation: CREATE_EXPERIENCE_MUTATION,
    variables: {
      createExperienceInput: experienceDefinitionArgs,
    },
  }).then(result => {
    const experience =
      result &&
      result.data &&
      (result.data.createExperience as ExperienceFragment);

    if (persist) {
      return persistCache().then(() => {
        return experience;
      });
    }

    return experience;
  });
}

export function createUnsavedExperience(
  experienceDefinitionArgs: CreateExperienceInput,
  { persist }: { persist?: boolean } = {},
) {
  return mutate<
    CreateUnsavedExperienceMutationData,
    CreateExperienceMutationVariables
  >({
    mutation: CREATE_UNSAVED_EXPERIENCE_MUTATION,
    variables: {
      createExperienceInput: experienceDefinitionArgs,
    },
  }).then(result => {
    const experience =
      result &&
      result.data &&
      (result.data.createUnsavedExperience as ExperienceFragment);

    if (persist) {
      return persistCache().then(() => {
        return experience;
      });
    }

    return experience;
  });
}

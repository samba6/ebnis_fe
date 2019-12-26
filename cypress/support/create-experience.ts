import { mutate, persistCache } from "./mutate";
import { CreateExperienceInput } from "../../src/graphql/apollo-types/globalTypes";
import { CREATE_EXPERIENCE_MUTATION } from "../../src/graphql/create-experience.mutation";
import {
  CreateExperienceMutation,
  CreateExperienceMutationVariables,
} from "../../src/graphql/apollo-types/CreateExperienceMutation";
import { ExperienceFragment } from "../../src/graphql/apollo-types/ExperienceFragment";
import {
  CreateOfflineExperienceMutationData,
  CREATE_OFFLINE_EXPERIENCE_MUTATION,
} from "../../src/components/ExperienceDefinition/experience-definition.resolvers";

export function createSavedExperience(
  experienceDefinitionArgs: CreateExperienceInput,
  { persist }: { persist?: boolean } = {},
) {
  return mutate<CreateExperienceMutation, CreateExperienceMutationVariables>({
    mutation: CREATE_EXPERIENCE_MUTATION,
    variables: {
      createExperienceInput: experienceDefinitionArgs,
      entriesPagination: { first: 2000 },
    },
  }).then(result => {
    const experience = (result &&
      result.data &&
      result.data.createExperience &&
      result.data.createExperience.experience) as ExperienceFragment;

    if (persist) {
      return persistCache().then(() => {
        return experience;
      });
    }

    return experience;
  });
}

export function createOfflineExperience(
  experienceDefinitionArgs: CreateExperienceInput,
  { persist }: { persist?: boolean } = {},
) {
  return mutate<
    CreateOfflineExperienceMutationData,
    CreateExperienceMutationVariables
  >({
    mutation: CREATE_OFFLINE_EXPERIENCE_MUTATION,
    variables: {
      createExperienceInput: experienceDefinitionArgs,
      entriesPagination: { first: 2000 },
    },
  }).then(result => {
    const experience =
      result &&
      result.data &&
      (result.data.createOfflineExperience as ExperienceFragment);

    if (persist) {
      return persistCache().then(() => {
        return experience;
      });
    }

    return experience;
  });
}

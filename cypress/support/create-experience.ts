import { mutate, persistCache } from "./mutate";
import { CreateExperienceInput } from "../../src/graphql/apollo-types/globalTypes";
import { CREATE_EXPERIENCES_MUTATION } from "../../src/graphql/experiences.mutation";
import {
  CreateExperiences,
  CreateExperiencesVariables,
  CreateExperiences_createExperiences_ExperienceSuccess,
} from "../../src/graphql/apollo-types/CreateExperiences";
import { ExperienceFragment } from "../../src/graphql/apollo-types/ExperienceFragment";
import {
  CreateExperienceOfflineMutation,
  CREATE_OFFLINE_EXPERIENCE_MUTATION,
} from "../../src/components/ExperienceDefinition/experience-definition.resolvers";
import { entriesPaginationVariables } from "../../src/graphql/get-experience-full.query";

export function createOnlineExperience(
  input: CreateExperienceInput,
  { persist }: { persist?: boolean } = {},
) {
  return mutate<CreateExperiences, CreateExperiencesVariables>({
    mutation: CREATE_EXPERIENCES_MUTATION,
    variables: {
      input: [input],
      ...entriesPaginationVariables,
    },
  }).then(result => {
    const validResponses =
      result && result.data && result.data.createExperiences;

    const experience = (validResponses[0] as CreateExperiences_createExperiences_ExperienceSuccess)
      .experience;

    if (persist) {
      return persistCache().then(() => {
        return experience;
      });
    }

    return experience;
  });
}

export function createOfflineExperience(
  input: CreateExperienceInput,
  { persist }: { persist?: boolean } = {},
) {
  return mutate<CreateExperienceOfflineMutation, CreateExperiencesVariables>({
    mutation: CREATE_OFFLINE_EXPERIENCE_MUTATION,
    variables: {
      input: [input],
      ...entriesPaginationVariables,
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

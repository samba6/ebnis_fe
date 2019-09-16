import {
  CreateExperienceMutation,
  CreateExperienceMutationVariables,
} from "../../graphql/apollo-types/CreateExperienceMutation";
import { CREATE_EXPERIENCE_MUTATION } from "../../graphql/create-experience.mutation";
import { useMutation } from "react-apollo";
import ApolloClient from "apollo-client";
import {
  experienceDefinitionResolvers,
  CREATE_UNSAVED_EXPERIENCE_MUTATION,
  CreateUnsavedExperienceMutationData,
} from "./resolvers";

export function useCreateExperience() {
  return useMutation<
    CreateExperienceMutation,
    CreateExperienceMutationVariables
  >(CREATE_EXPERIENCE_MUTATION);
}

export function useCreateUnsavedExperience() {
  return useMutation<
    CreateUnsavedExperienceMutationData,
    CreateExperienceMutationVariables
  >(CREATE_UNSAVED_EXPERIENCE_MUTATION);
}

export function addResolvers(client: ApolloClient<{}>) {
  if (window.____ebnis.experienceDefinitionResolversAdded) {
    return;
  }

  client.addResolvers(experienceDefinitionResolvers);
  window.____ebnis.experienceDefinitionResolversAdded = true;
}

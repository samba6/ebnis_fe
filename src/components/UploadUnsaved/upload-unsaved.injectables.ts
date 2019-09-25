import {
  UPLOAD_UNSAVED_EXPERIENCES_MUTATION,
  UPLOAD_ALL_UNSAVEDS_MUTATION,
} from "../../graphql/upload-unsaveds.mutation";
import {
  UploadUnsavedExperiencesMutation,
  UploadUnsavedExperiencesMutationVariables,
} from "../../graphql/apollo-types/UploadUnsavedExperiencesMutation";
import { useMutation, useQuery } from "@apollo/react-hooks";
import ApolloClient from "apollo-client";
import {
  unsavedResolvers,
  GET_ALL_UNSAVED_QUERY,
  GetAllUnSavedQueryReturned,
} from "../../state/unsaved-resolvers";
import {
  UploadAllUnsavedsMutation,
  UploadAllUnsavedsMutationVariables,
} from "../../graphql/apollo-types/UploadAllUnsavedsMutation";
import { CREATE_ENTRIES_MUTATION } from "../../graphql/create-entries.mutation";
import {
  CreateEntriesMutation,
  CreateEntriesMutationVariables,
} from "../../graphql/apollo-types/CreateEntriesMutation";

let resolversAdded = false;

export function addUploadUnsavedResolvers(client: ApolloClient<{}>) {
  if (resolversAdded === true) {
    return;
  }

  client.addResolvers(unsavedResolvers);
  resolversAdded = true;
}

export function useUploadUnsavedExperiencesMutation() {
  return useMutation<
    UploadUnsavedExperiencesMutation,
    UploadUnsavedExperiencesMutationVariables
  >(UPLOAD_UNSAVED_EXPERIENCES_MUTATION);
}

export function useUploadAllUnsavedsMutation() {
  return useMutation<
    UploadAllUnsavedsMutation,
    UploadAllUnsavedsMutationVariables
  >(UPLOAD_ALL_UNSAVEDS_MUTATION);
}

export function useUploadSavedExperiencesEntriesMutation() {
  return useMutation<CreateEntriesMutation, CreateEntriesMutationVariables>(
    CREATE_ENTRIES_MUTATION,
  );
}

export function useGetAllUnsavedQuery() {
  return useQuery<GetAllUnSavedQueryReturned, {}>(
    GET_ALL_UNSAVED_QUERY,

    {
      fetchPolicy: "cache-and-network",
    },
  );
}

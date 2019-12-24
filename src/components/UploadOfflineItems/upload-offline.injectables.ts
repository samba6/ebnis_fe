import {
  UPLOAD_OFFLINE_EXPERIENCES_MUTATION,
  UPLOAD_OFFLINE_ITEMS_MUTATION,
} from "../../graphql/upload-offline-items.mutation";
import {
  UploadOfflineExperiencesMutation,
  UploadUnsavedExperiencesMutationVariables,
} from "../../graphql/apollo-types/UploadOfflineExperiencesMutation";
import { useMutation, useQuery } from "@apollo/react-hooks";
import ApolloClient from "apollo-client";
import {
  unsavedResolvers,
  GET_ALL_UNSAVED_QUERY,
  GetAllUnSavedQueryReturned,
} from "../../state/offline-resolvers";
import {
  UploadOfflineItemsMutation,
  UploadOfflineItemsMutationVariables,
} from "../../graphql/apollo-types/UploadOfflineItemsMutation";
import { CREATE_ENTRIES_MUTATION } from "../../graphql/create-entries.mutation";
import {
  CreateEntriesMutation,
  CreateEntriesMutationVariables,
} from "../../graphql/apollo-types/CreateEntriesMutation";

let resolversAdded = false;

export function addUploadOfflineItemsResolvers(client: ApolloClient<{}>) {
  if (resolversAdded === true) {
    return;
  }

  client.addResolvers(unsavedResolvers);
  resolversAdded = true;
}

export function useUploadOfflineExperiencesMutation() {
  return useMutation<
    UploadOfflineExperiencesMutation,
    UploadUnsavedExperiencesMutationVariables
  >(UPLOAD_OFFLINE_EXPERIENCES_MUTATION);
}

export function useUploadOfflineItemsMutation() {
  return useMutation<
    UploadOfflineItemsMutation,
    UploadOfflineItemsMutationVariables
  >(UPLOAD_OFFLINE_ITEMS_MUTATION);
}

export function useUploadOnlineEntriesMutation() {
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

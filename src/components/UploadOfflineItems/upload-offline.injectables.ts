import {
  UPLOAD_OFFLINE_EXPERIENCES_MUTATION,
  UPLOAD_OFFLINE_ITEMS_MUTATION,
} from "../../graphql/upload-offline-items.mutation";
import {
  UploadOfflineExperiencesMutation,
  UploadOfflineExperiencesMutationVariables,
} from "../../graphql/apollo-types/UploadOfflineExperiencesMutation";
import { useMutation, useQuery } from "@apollo/react-hooks";
import ApolloClient from "apollo-client";
import {
  offlineItemsResolvers,
  GET_OFFLINE_ITEMS_QUERY,
  GetOfflineItemsQueryReturned,
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

  client.addResolvers(offlineItemsResolvers);
  resolversAdded = true;
}

export function useUploadOfflineExperiencesMutation() {
  return useMutation<
    UploadOfflineExperiencesMutation,
    UploadOfflineExperiencesMutationVariables
  >(UPLOAD_OFFLINE_EXPERIENCES_MUTATION);
}

export function useUploadOfflineItemsMutation() {
  return useMutation<
    UploadOfflineItemsMutation,
    UploadOfflineItemsMutationVariables
  >(UPLOAD_OFFLINE_ITEMS_MUTATION);
}

export function useUploadOfflineEntriesMutation() {
  return useMutation<CreateEntriesMutation, CreateEntriesMutationVariables>(
    CREATE_ENTRIES_MUTATION,
  );
}

export function useGetAllUnsavedQuery() {
  return useQuery<GetOfflineItemsQueryReturned, {}>(
    GET_OFFLINE_ITEMS_QUERY,

    {
      fetchPolicy: "cache-and-network",
    },
  );
}

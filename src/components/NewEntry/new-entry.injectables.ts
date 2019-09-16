/* eslint-disable react-hooks/rules-of-hooks */
import { ApolloClient } from "apollo-client";
import { newEntryResolvers } from "./resolvers";
import { useMutation } from "react-apollo";
import { CREATE_ENTRY_MUTATION } from "../../graphql/create-entry.mutation";
import {
  CreateEntryMutation,
  CreateEntryMutationVariables,
} from "../../graphql/apollo-types/CreateEntryMutation";
import {
  CREATE_UNSAVED_ENTRY_MUTATION,
  CreateUnsavedEntryMutationReturned,
  CreateUnsavedEntryVariables,
} from "./resolvers";

export function addResolvers(client: ApolloClient<{}>) {
  if (window.____ebnis.newEntryResolversAdded) {
    return;
  }

  client.addResolvers(newEntryResolvers);
  window.____ebnis.newEntryResolversAdded = true;
}

export function useCreateOnlineEntry() {
  return useMutation<CreateEntryMutation, CreateEntryMutationVariables>(
    CREATE_ENTRY_MUTATION,
  );
}

export function useCreateUnsavedEntry() {
  return useMutation<
    CreateUnsavedEntryMutationReturned,
    CreateUnsavedEntryVariables
  >(CREATE_UNSAVED_ENTRY_MUTATION);
}

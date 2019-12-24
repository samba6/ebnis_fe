import { mutate, persistCache } from "./mutate";
import { CreateEntriesInput } from "../../src/graphql/apollo-types/globalTypes";
import {
  CreateEntriesMutation,
  CreateEntriesMutationVariables,
} from "../../src/graphql/apollo-types/CreateEntriesMutation";
import { CREATE_ENTRIES_MUTATION } from "../../src/graphql/create-entries.mutation";
import { EntryFragment } from "../../src/graphql/apollo-types/EntryFragment";
import {
  CreateEntryOfflineVariables,
  CreateEntryOfflineMutationReturned,
  CREATE_ENTRY_OFFLINE_MUTATION,
} from "../../src/components/NewEntry/new-entry.resolvers";

export function createExperienceEntries(input: CreateEntriesInput[]) {
  return mutate<CreateEntriesMutation, CreateEntriesMutationVariables>({
    mutation: CREATE_ENTRIES_MUTATION,
    variables: {
      input,
    },
  }).then(result => {
    const data = result && result.data && result.data.createEntries;

    const entries = data.reduce(
      (acc, obj) => {
        return acc.concat(obj.entries);
      },
      [] as EntryFragment[],
    );

    return entries;
  });
}

export function createEntryOffline(
  variables: CreateEntryOfflineVariables,
  persist?: boolean,
) {
  return mutate<
    CreateEntryOfflineMutationReturned,
    CreateEntryOfflineVariables
  >({
    mutation: CREATE_ENTRY_OFFLINE_MUTATION,
    variables,
  }).then(result => {
    const offlineEntry = (result &&
      result.data &&
      result.data.createEntryOffline &&
      result.data.createEntryOffline.entry) as EntryFragment;

    if (persist) {
      return persistCache().then(() => {
        return offlineEntry;
      });
    }

    return offlineEntry;
  });
}

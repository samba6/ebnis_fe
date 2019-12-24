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
  CreateOfflineEntryMutationReturned,
  CREATE_OFFLINE_ENTRY_MUTATION,
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

export function createOfflineEntry(
  variables: CreateEntryOfflineVariables,
  persist?: boolean,
) {
  return mutate<
    CreateOfflineEntryMutationReturned,
    CreateEntryOfflineVariables
  >({
    mutation: CREATE_OFFLINE_ENTRY_MUTATION,
    variables,
  }).then(result => {
    const offlineEntry = (result &&
      result.data &&
      result.data.createOfflineEntry &&
      result.data.createOfflineEntry.entry) as EntryFragment;

    if (persist) {
      return persistCache().then(() => {
        return offlineEntry;
      });
    }

    return offlineEntry;
  });
}

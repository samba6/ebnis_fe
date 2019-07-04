import { mutate, persistCache } from "./mutate";
import { CreateEntryInput } from "../../src/graphql/apollo-types/globalTypes";
import {
  CreateEntriesMutation,
  CreateEntriesMutationVariables,
} from "../../src/graphql/apollo-types/CreateEntriesMutation";
import { CREATE_ENTRIES_MUTATION } from "../../src/graphql/create-entries.mutation";
import { EntryFragment } from "../../src/graphql/apollo-types/EntryFragment";
import {
  CreateUnsavedEntryVariables,
  CreateUnsavedEntryMutationReturned,
  CREATE_UNSAVED_ENTRY_MUTATION,
} from "../../src/components/NewEntry/resolvers";

export function createExperienceEntries(
  experienceId: string,
  createEntries: CreateEntryInput[],
) {
  return mutate<CreateEntriesMutation, CreateEntriesMutationVariables>({
    mutation: CREATE_ENTRIES_MUTATION,
    variables: {
      createEntries,
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

export function createUnsavedEntry(
  variables: CreateUnsavedEntryVariables,
  persist?: boolean,
) {
  return mutate<
    CreateUnsavedEntryMutationReturned,
    CreateUnsavedEntryVariables
  >({
    mutation: CREATE_UNSAVED_ENTRY_MUTATION,
    variables,
  }).then(result => {
    const unsavedEntry = (result &&
      result.data &&
      result.data.createUnsavedEntry &&
      result.data.createUnsavedEntry.entry) as EntryFragment;

    if (persist) {
      return persistCache().then(isPersisted => {
        expect(isPersisted).to.eq(true);

        return unsavedEntry;
      });
    }

    return unsavedEntry;
  });
}

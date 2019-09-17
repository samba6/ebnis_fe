import {
  LocalResolverFn,
  MUTATION_NAME_createUnsavedEntry,
} from "../../state/resolvers";
import { makeUnsavedId } from "../../constants";
import { CreateDataObject } from "../../graphql/apollo-types/globalTypes";
import gql from "graphql-tag";
import { updateExperienceWithNewEntry } from "./update";
import { ENTRY_FRAGMENT } from "../../graphql/entry.fragment";
import { ExperienceFragment } from "../../graphql/apollo-types/ExperienceFragment";
import { EntryFragment } from "../../graphql/apollo-types/EntryFragment";
import { updateEntriesCountSavedAndUnsavedExperiencesInCache } from "../../state/resolvers/update-saved-and-unsaved-experiences-in-cache";
import { CreateEntryMutation_createEntry } from "../../graphql/apollo-types/CreateEntryMutation";

export const CREATE_UNSAVED_ENTRY_MUTATION = gql`
  mutation CreateUnsavedEntry(
    $experience: Experience!
    $dataObjects: [DataObjects!]!
  ) {
    createUnsavedEntry(experience: $experience, dataObjects: $dataObjects)
      @client {
      entry {
        ...EntryFragment
      }
    }
  }

  ${ENTRY_FRAGMENT}
`;

export interface CreateUnsavedEntryMutationReturned {
  createUnsavedEntry: {
    id: string;
    entry: EntryFragment;
    experience: ExperienceFragment;
    __typename: "Entry";
  };
}

const createUnsavedEntryResolver: LocalResolverFn<
  CreateUnsavedEntryVariables,
  Promise<CreateUnsavedEntryMutationReturned["createUnsavedEntry"]>
> = async (_, variables, context) => {
  const { client } = context;

  let experience = { ...variables.experience };
  experience.hasUnsaved = true;

  const { id: experienceId } = experience;
  const today = new Date();
  const timestamps = today.toJSON();

  const id = makeUnsavedId(today.getTime());

  const dataObjects = variables.dataObjects.map((dataObject, index) => {
    const dataObjectId = `${id}--data-object-${index}`;

    return {
      ...dataObject,
      __typename: "DataObject" as "DataObject",
      id: dataObjectId,
      clientId: dataObjectId,
      insertedAt: timestamps,
      updatedAt: timestamps,
    };
  });

  const entry: EntryFragment = {
    __typename: "Entry",
    id,
    clientId: id,
    experienceId,
    dataObjects,
    insertedAt: timestamps,
    updatedAt: timestamps,
  };

  experience = (await updateExperienceWithNewEntry(experience)(client, {
    data: { createEntry: { entry } as CreateEntryMutation_createEntry },
  })) as ExperienceFragment;

  updateEntriesCountSavedAndUnsavedExperiencesInCache(client, experienceId);

  return { id, experience, entry, __typename: "Entry" };
};

export interface CreateUnsavedEntryVariables {
  dataObjects: (CreateDataObject)[];
  experience: ExperienceFragment;
}

export const newEntryResolvers = {
  Mutation: {
    [MUTATION_NAME_createUnsavedEntry]: createUnsavedEntryResolver,
  },

  Query: {},
};

import {
  LocalResolverFn,
  MUTATION_NAME_createOfflineEntry,
} from "../../state/resolvers";
import { makeOfflineId } from "../../constants";
import { CreateDataObject } from "../../graphql/apollo-types/globalTypes";
import gql from "graphql-tag";
import { updateExperienceWithNewEntry } from "./new-entry.injectables";
import { ENTRY_FRAGMENT } from "../../graphql/entry.fragment";
import { ExperienceFragment } from "../../graphql/apollo-types/ExperienceFragment";
import { EntryFragment } from "../../graphql/apollo-types/EntryFragment";
import { updateCacheExperienceOfflineEntriesCount } from "../../state/resolvers/update-experiences-in-cache";
import { CreateEntryMutation_createEntry } from "../../graphql/apollo-types/CreateEntryMutation";

export const CREATE_OFFLINE_ENTRY_MUTATION = gql`
  mutation CreateOfflineEntry(
    $experience: Experience!
    $dataObjects: [DataObjects!]!
  ) {
    createOfflineEntry(experience: $experience, dataObjects: $dataObjects)
      @client {
      entry {
        ...EntryFragment
      }
    }
  }

  ${ENTRY_FRAGMENT}
`;

export interface CreateOfflineEntryMutationReturned {
  createOfflineEntry: {
    id: string;
    entry: EntryFragment;
    experience: ExperienceFragment;
    __typename: "Entry";
  };
}

const createOfflineEntryResolver: LocalResolverFn<
  CreateEntryOfflineVariables,
  Promise<CreateOfflineEntryMutationReturned["createOfflineEntry"]>
> = async (_, variables, context) => {
  const { client } = context;

  let experience = { ...variables.experience };
  experience.hasUnsaved = true;

  const { id: experienceId } = experience;
  const today = new Date();
  const timestamps = today.toJSON();

  const id = makeOfflineId(today.getTime());

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

  updateCacheExperienceOfflineEntriesCount(client, experienceId);

  return { id, experience, entry, __typename: "Entry" };
};

export interface CreateEntryOfflineVariables {
  dataObjects: (CreateDataObject)[];
  experience: ExperienceFragment;
}

export const newEntryResolvers = {
  Mutation: {
    [MUTATION_NAME_createOfflineEntry]: createOfflineEntryResolver,
  },

  Query: {},
};

import { useMutation } from "@apollo/react-hooks";
import {
  MutationFunction,
  MutationFunctionOptions,
  MutationResult,
} from "@apollo/react-common";
import {
  LocalResolverFn,
  MUTATION_NAME_createOfflineEntry,
} from "../../state/resolvers";
import { makeOfflineId, isOfflineId } from "../../constants";
import { CreateDataObject } from "../../graphql/apollo-types/globalTypes";
import gql from "graphql-tag";
import { upsertExperienceWithEntry } from "./new-entry.injectables";
import { ENTRY_FRAGMENT } from "../../graphql/entry.fragment";
import { ExperienceFragment } from "../../graphql/apollo-types/ExperienceFragment";
import { EntryFragment } from "../../graphql/apollo-types/EntryFragment";
import {
  getUnsyncedExperience,
  UnsyncedModifiedExperience,
  writeUnsyncedExperience,
} from "../../apollo-cache/unsynced.resolvers";

export const CREATE_OFFLINE_ENTRY_MUTATION = gql`
  mutation CreateOfflineEntry(
    $experienceId: String!
    $dataObjects: [DataObjects!]!
  ) {
    createOfflineEntry(experienceId: $experienceId, dataObjects: $dataObjects)
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

const createOfflineEntryMutationResolver: LocalResolverFn<
  CreateOfflineEntryMutationVariables,
  CreateOfflineEntryMutationReturned["createOfflineEntry"]
> = (_, variables, context) => {
  const { cache } = context;

  const { experienceId } = variables;
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

  const experience = upsertExperienceWithEntry(
    cache,
    entry,
    experienceId,
  ) as ExperienceFragment;

  updateUnsynced(experienceId);

  return { id, experience, entry, __typename: "Entry" };
};

export interface CreateOfflineEntryMutationVariables {
  dataObjects: CreateDataObject[];
  experienceId: string;
}

export const newEntryResolvers = {
  Mutation: {
    [MUTATION_NAME_createOfflineEntry]: createOfflineEntryMutationResolver,
  },

  Query: {},
};

function updateUnsynced(experienceId: string) {
  if (isOfflineId(experienceId)) {
    return;
  }

  const unsyncedExperience = (getUnsyncedExperience(experienceId) ||
    {}) as UnsyncedModifiedExperience;

  unsyncedExperience.newEntries = true;
  writeUnsyncedExperience(experienceId, unsyncedExperience);
}

////////////////////////// TYPES SECTION ////////////////////////////

// istanbul ignore next:
export function useCreateOfflineEntryMutation(): UseCreateOfflineEntryMutation {
  return useMutation(CREATE_OFFLINE_ENTRY_MUTATION);
}

export type CreateOfflineEntryMutationFn = MutationFunction<
  CreateOfflineEntryMutationReturned,
  CreateOfflineEntryMutationVariables
>;

// used to type check test mock calls
export type CreateOfflineEntryMutationFnOptions = MutationFunctionOptions<
  CreateOfflineEntryMutationReturned,
  CreateOfflineEntryMutationVariables
>;

export type UseCreateOfflineEntryMutation = [
  CreateOfflineEntryMutationFn,
  MutationResult<CreateOfflineEntryMutationReturned>,
];

// component's props should extend this
export interface CreateOfflineEntryMutationComponentProps {
  createOfflineEntry: CreateOfflineEntryMutationFn;
}

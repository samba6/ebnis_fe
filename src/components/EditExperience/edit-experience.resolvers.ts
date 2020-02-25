/* eslint-disable react-hooks/rules-of-hooks*/
import { useMutation } from "@apollo/react-hooks";
import {
  MutationFunctionOptions,
  MutationResult,
  ExecutionResult,
  MutationFunction,
} from "@apollo/react-common";
import gql from "graphql-tag";
import immer, { Draft } from "immer";
import { writeExperienceFragmentToCache } from "../../apollo-cache/write-experience-fragment";
import { readExperienceFragment } from "../../apollo-cache/read-experience-fragment";
import { floatExperienceToTheTopInGetExperiencesMiniQuery } from "../../apollo-cache/update-get-experiences-mini-query";
import {
  UpdateAnExperienceInput,
  UpdateDefinitionInput,
} from "../../graphql/apollo-types/globalTypes";
import { LocalResolverFn } from "../../state/resolvers";
import { ExperienceFragment } from "../../graphql/apollo-types/ExperienceFragment";
import { DataDefinitionFragment } from "../../graphql/apollo-types/DataDefinitionFragment";
import { EXPERIENCE_FRAGMENT } from "../../graphql/experience.fragment";
import {
  getUnsyncedExperience,
  UnsyncedModifiedExperience,
  ModifiedExperienceUnsyncedDefinition,
  writeUnsyncedExperience,
} from "../../apollo-cache/unsynced.resolvers";
import { isOfflineId } from "../../constants";

const updateExperienceOfflineResolver: LocalResolverFn<
  UpdateExperienceOfflineVariables,
  UpdateExperienceOffline["updateExperienceOffline"]
> = (_, { input }, { cache }) => {
  const {
    experienceId,
    ownFields,
    updateDefinitions: definitionsInput,
  } = input;
  const experience = readExperienceFragment(cache, experienceId);

  if (!experience) {
    return {
      __typename: "UpdateExperienceOfflineError",
      error: {
        error: "experience not found",
      },
    };
  }

  const today = new Date();
  const timestamp = today.toJSON();
  let unsyncedExperience: MaybeUnsynced = null;

  if (!isOfflineId(experienceId)) {
    unsyncedExperience = (getUnsyncedExperience(experienceId) ||
      {}) as UnsyncedModifiedExperience;
  }

  const updatedExperience = immer(experience, proxy => {
    proxy.hasUnsaved = true;
    proxy.updatedAt = timestamp;

    if (ownFields) {
      const unsyncedOwnFields = unsyncedExperience
        ? unsyncedExperience.ownFields || {}
        : null;

      Object.entries(ownFields).forEach(([k, v]) => {
        proxy[k] = v;
        if (unsyncedOwnFields) {
          unsyncedOwnFields[k] = true;
        }
      });

      if (unsyncedExperience) {
        unsyncedExperience.ownFields = unsyncedOwnFields as UnsyncedModifiedExperience["ownFields"];
      }
    }

    updateDefinitions(proxy, unsyncedExperience, definitionsInput);
  });

  writeExperienceFragmentToCache(cache, updatedExperience);
  floatExperienceToTheTopInGetExperiencesMiniQuery(cache, updatedExperience);

  if (unsyncedExperience) {
    writeUnsyncedExperience(experienceId, unsyncedExperience);
  }

  return {
    __typename: "UpdateExperienceOfflineSuccess",
    data: {
      __typename: "a",
      ...input,
    },
  };
};

function updateDefinitions(
  proxy: DraftState,
  unsyncedExperience: DraftUnsynced,
  inputs?: UpdateDefinitionInput[] | null,
) {
  if (!inputs) {
    return [];
  }

  const idToDefinitionToUpdateMap: {
    [k: string]: DefinitionUpdateVal;
  } = {};

  const updatedAts: string[] = [];

  inputs.forEach(({ id, name, updatedAt }) => {
    const updateVal: DefinitionUpdateVal = { name };

    if (updatedAt) {
      updateVal.updatedAt = updatedAt;
      updatedAts.push(updatedAt);
    }

    idToDefinitionToUpdateMap[id] = updateVal;
  });

  const unsyncedDefinitions = unsyncedExperience
    ? unsyncedExperience.definitions || {}
    : null;

  proxy.dataDefinitions = proxy.dataDefinitions.map(d => {
    const definition = d as DataDefinitionFragment;
    const { id } = definition;

    const found = idToDefinitionToUpdateMap[id];

    if (found) {
      const unsyncedDefinition = unsyncedDefinitions
        ? unsyncedDefinitions[id] || {}
        : null;

      Object.entries(found).forEach(([k, v]) => {
        definition[k] = v;
        if (unsyncedDefinition) {
          unsyncedDefinition[k] = true;
        }
      });

      if (unsyncedDefinitions) {
        unsyncedDefinitions[
          id
        ] = unsyncedDefinition as ModifiedExperienceUnsyncedDefinition;
      }
    }

    return definition;
  });

  if (unsyncedExperience) {
    unsyncedExperience.definitions = unsyncedDefinitions as UnsyncedModifiedExperience["definitions"];
  }

  return updatedAts;
}

export const UPDATE_EXPERIENCE_OFFLINE_MUTATION = gql`
  mutation UpdateExperienceOffline($input: UpdateAnExperienceInput!) {
    updateExperienceOffline(input: $input) @client {
      __typename
      ... on UpdateExperienceOfflineError {
        error {
          error
        }
      }

      ... on UpdateExperienceOfflineSuccess {
        data {
          experienceId
          ownFields
          updateDefinitions
        }
      }
    }
  }
  ${EXPERIENCE_FRAGMENT}
`;

export const updateExperienceOfflineResolvers = {
  Mutation: {
    updateExperienceOffline: updateExperienceOfflineResolver,
  },
  Query: {},
};

////////////////////////// TYPES SECTION ////////////////////////////

interface UpdateExperienceOfflineError {
  __typename: "UpdateExperienceOfflineError";
  error: {
    error: string;
  };
}

interface UpdateExperienceOfflineSuccess {
  __typename: "UpdateExperienceOfflineSuccess";
  data: UpdateExperienceOfflineVariables["input"] & {
    __typename: "a";
  };
}

export interface UpdateExperienceOffline {
  updateExperienceOffline:
    | UpdateExperienceOfflineError
    | UpdateExperienceOfflineSuccess;
}

type DraftState = Draft<ExperienceFragment>;

interface DefinitionUpdateVal {
  name: string;
  updatedAt?: string;
}

export interface UpdateExperienceOfflineVariables {
  input: UpdateAnExperienceInput;
}

type MaybeUnsynced = UnsyncedModifiedExperience | null;
type DraftUnsynced = Draft<MaybeUnsynced>;

////////////////////////// end TYPES SECTION ///////////////////////

////////////////////////// USE MUTATIONS SECTION //////////////////

export function useUpdateExperienceOfflineMutation(): UseUpdateExperienceOfflineMutation {
  return useMutation(UPDATE_EXPERIENCE_OFFLINE_MUTATION);
}

export type UpdateExperienceOfflineMutationFn = MutationFunction<
  UpdateExperienceOffline,
  UpdateExperienceOfflineVariables
>;

export type UpdateExperienceOfflineMutationResult = ExecutionResult<
  UpdateExperienceOffline
>;

// used to type check test mock calls
export type UpdateExperienceOfflineeMutationFnOptions = MutationFunctionOptions<
  UpdateExperienceOffline,
  UpdateExperienceOfflineVariables
>;

export type UseUpdateExperienceOfflineMutation = [
  UpdateExperienceOfflineMutationFn,
  MutationResult<UpdateExperienceOffline>,
];

// component's props should extend this
export interface UpdateExperienceOfflineComponentProps {
  updateExperienceOffline: UpdateExperienceOfflineMutationFn;
}

////////////////////////// END USE MUTATIONS SECTION //////////////////

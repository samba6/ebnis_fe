/* eslint-disable react-hooks/rules-of-hooks*/
import {
  LocalResolverFn,
  MUTATION_NAME_createExperienceOffline,
} from "../../state/resolvers";
import { CreateDataDefinition } from "../../graphql/apollo-types/globalTypes";
import { makeOfflineId } from "../../constants";
import gql from "graphql-tag";
import {
  ExperienceFragment_dataDefinitions,
  ExperienceFragment,
} from "../../graphql/apollo-types/ExperienceFragment";
import { EXPERIENCE_FRAGMENT } from "../../graphql/experience.fragment";
import { insertExperienceInGetExperiencesMiniQuery } from "../../apollo-cache/update-get-experiences-mini-query";
import { writeUnsyncedExperience } from "../../apollo-cache/unsynced.resolvers";
import { writeExperienceFragmentToCache } from "../../apollo-cache/write-experience-fragment";
import { useMutation } from "@apollo/react-hooks";
import {
  MutationFunction,
  MutationFunctionOptions,
  MutationResult,
  ExecutionResult,
} from "@apollo/react-common";
import { CreateExperiencesVariables } from "../../graphql/apollo-types/CreateExperiences";

const createOfflineExperienceResolver: LocalResolverFn<
  CreateExperiencesVariables,
  ExperienceFragment
> = (_, { input: inputs }, { cache, client }) => {
  const today = new Date();
  const timestamp = today.toJSON();
  const experienceId = makeOfflineId(today.getTime());

  const {
    dataDefinitions: createDataDefinitions,
    title,
    description,
  } = inputs[0];

  const dataDefinitions: ExperienceFragment_dataDefinitions[] = (createDataDefinitions as CreateDataDefinition[]).map(
    ({ name, type }, index) => {
      const id = experienceId + "--" + index;

      return {
        __typename: "DataDefinition",
        name,
        type,
        id,
        clientId: id,
      };
    },
  );

  const experience: ExperienceFragment = {
    hasUnsaved: true,
    __typename: "Experience",
    id: experienceId,
    clientId: experienceId,
    insertedAt: timestamp,
    updatedAt: timestamp,
    description: description as string,
    title,
    dataDefinitions,
    entries: {
      __typename: "EntryConnection",
      edges: [],
      pageInfo: {
        __typename: "PageInfo",
        hasNextPage: false,
        hasPreviousPage: false,
      },
    },
  };

  writeExperienceFragmentToCache(cache, experience);

  insertExperienceInGetExperiencesMiniQuery(client, experience, {
    force: true,
  });

  writeUnsyncedExperience(experienceId, true);

  // incrementOfflineItemCount(cache, experienceId);

  return experience;
};

export const CREATE_OFFLINE_EXPERIENCE_MUTATION = gql`
  mutation CreateOfflineExperienceMutation(
    $createExperienceInput: CreateExperienceInput!
  ) {
    createOfflineExperience(createExperienceInput: $createExperienceInput)
      @client {
      ...ExperienceFragment
    }
  }

  ${EXPERIENCE_FRAGMENT}
`;

export interface CreateExperienceOfflineMutation {
  createOfflineExperience: ExperienceFragment;
}

export function useCreateExperienceOfflineMutation() {
  return useMutation<
    CreateExperienceOfflineMutation,
    CreateExperiencesVariables
  >(CREATE_OFFLINE_EXPERIENCE_MUTATION);
}

export type CreateExperienceOfflineMutationResult = ExecutionResult<
  CreateExperienceOfflineMutation
>;

export type CreateExperienceOfflineMutationFn = MutationFunction<
  CreateExperienceOfflineMutation,
  CreateExperiencesVariables
>;

// used to type check test mock calls
export type CreateOfflineExperienceMutationFnOptions = MutationFunctionOptions<
  CreateExperienceOfflineMutation,
  CreateExperiencesVariables
>;

export type UseCreateExperienceOfflineMutation = [
  CreateExperienceOfflineMutationFn,
  MutationResult<CreateExperienceOfflineMutation>,
];

// component's props should extend this
export interface CreateExperienceOfflineMutationComponentProps {
  createExperienceOffline: CreateExperienceOfflineMutationFn;
}

//////////////////////////// QUERIES /////////////////////////////////

//////////////////////////// END QUERIES ////////////////////////////

export const experienceDefinitionResolvers = {
  Mutation: {
    [MUTATION_NAME_createExperienceOffline]: createOfflineExperienceResolver,
  },

  Query: {},
};

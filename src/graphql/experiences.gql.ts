import gql from "graphql-tag";
import { EXPERIENCE_FRAGMENT } from "./experience.fragment";
import { DEFINITION_FRAGMENT } from "./data-definition.fragment";
import { useMutation } from "@apollo/react-hooks";
import {
  MutationFunctionOptions,
  MutationResult,
  ExecutionResult,
  MutationFunction,
} from "@apollo/react-common";
import {
  UpdateExperiencesOnline,
  UpdateExperiencesOnlineVariables,
} from "./apollo-types/UpdateExperiencesOnline";
import { ENTRY_FRAGMENT } from "./entry.fragment";
import {
  CreateExperiences,
  CreateExperiencesVariables,
} from "./apollo-types/CreateExperiences";
import { DATA_OBJECT_FRAGMENT } from "./data-object-fragment";
import {
  DeleteExperiences,
  DeleteExperiencesVariables,
} from "./apollo-types/DeleteExperiences";
import { UpdateExperienceInput } from "./apollo-types/globalTypes";
import { UpdateExperienceFragment } from "./apollo-types/UpdateExperienceFragment";
import { CommonError } from "../general-utils";
import { updateExperiencesInCache } from "../apollo-cache/update-experiences";

////////////////////////// UPDATE EXPERIENCES SECTION ////////////////////

const UPDATE_EXPERIENCE_ERROR_FRAGMENT = gql`
  fragment UpdateExperienceErrorFragment on UpdateExperienceError {
    experienceId
    error
  }
`;

const DEFINITION_ERROR_FRAGMENT = gql`
  fragment DefinitionErrorFragment on DefinitionError {
    id
    name
    type
    error
  }
`;

const UPDATE_EXPERIENCE_OWN_FIELDS_FRAGMENT = gql`
  fragment ExperienceOwnFieldsFragment on ExperienceOwnFields {
    title
    description
  }
`;

const UPDATE_EXPERIENCE_OWN_FIELDS_ERROR_FRAGMENT = gql`
  fragment UpdateExperienceOwnFieldsErrorFragment on UpdateExperienceOwnFieldsError {
    title
  }
`;

const UPDATE_EXPERIENCE_OWN_FIELDS_UNION_FRAGMENT = gql`
  fragment UpdateExperienceOwnFieldsUnionFragment on UpdateExperienceOwnFieldsUnion {
    __typename
    ... on UpdateExperienceOwnFieldsErrors {
      errors {
        ...UpdateExperienceOwnFieldsErrorFragment
      }
    }
    ... on ExperienceOwnFieldsSuccess {
      data {
        ...ExperienceOwnFieldsFragment
      }
    }
  }
  ${UPDATE_EXPERIENCE_OWN_FIELDS_ERROR_FRAGMENT}
  ${UPDATE_EXPERIENCE_OWN_FIELDS_FRAGMENT}
`;

const DEFINITION_SUCCESS_FRAGMENT = gql`
  fragment DefinitionSuccessFragment on DefinitionSuccess {
    definition {
      ...DataDefinitionFragment
    }
  }
  ${DEFINITION_FRAGMENT}
`;

const DEFINITION_ERRORS_FRAGMENT = gql`
  fragment DefinitionErrorsFragment on DefinitionErrors {
    errors {
      ...DefinitionErrorFragment
    }
  }
  ${DEFINITION_ERROR_FRAGMENT}
`;

const UPDATE_DEFINITION_UNION_FRAGMENT = gql`
  fragment UpdateDefinitionUnionFragment on UpdateDefinition {
    __typename
    ... on DefinitionErrors {
      ...DefinitionErrorsFragment
    }

    ... on DefinitionSuccess {
      ...DefinitionSuccessFragment
    }
  }
  ${DEFINITION_ERRORS_FRAGMENT}
  ${DEFINITION_SUCCESS_FRAGMENT}
`;

const CREATE_ENTRY_ERROR_FRAGMENT = gql`
  fragment CreateEntryErrorFragment on CreateEntryError {
    meta {
      experienceId
      index
      clientId
    }
    error
    clientId
    experienceId
    dataObjects {
      meta {
        index
        id
        clientId
      }
      definition
      definitionId
      clientId
      data
    }
  }
`;

const CREATE_ENTRY_ERRORS_FRAGMENT = gql`
  fragment CreateEntryErrorsFragment on CreateEntryErrors {
    errors {
      ...CreateEntryErrorFragment
    }
  }
  ${CREATE_ENTRY_ERROR_FRAGMENT}
`;

const CREATE_ENTRY_SUCCESS_FRAGMENT = gql`
  fragment CreateEntrySuccessFragment on CreateEntrySuccess {
    entry {
      ...EntryFragment
    }
  }
  ${ENTRY_FRAGMENT}
`;

const UPDATE_ENTRY_ERROR_FRAGMENT = gql`
  fragment UpdateEntryErrorFragment on UpdateEntryError {
    entryId
    error
  }
`;

const DATA_OBJECT_ERROR_FRAGMENT = gql`
  fragment DataObjectErrorFragment on DataObjectError {
    meta {
      index
      id
      clientId
    }
    definition
    definitionId
    clientId
    data
    error
  }
`;

const UPDATE_ENTRY_FRAGMENT = gql`
  fragment UpdateEntryFragment on UpdateEntry {
    entryId
    updatedAt
    dataObjects {
      __typename
      ... on DataObjectErrors {
        errors {
          ...DataObjectErrorFragment
        }
      }
      ... on DataObjectSuccess {
        dataObject {
          ...DataObjectFragment
        }
      }
    }
  }

  ${DATA_OBJECT_ERROR_FRAGMENT}
  ${DATA_OBJECT_FRAGMENT}
`;

export const UPDATE_ENTRY_UNION_FRAGMENT = gql`
  fragment UpdateEntryUnionFragment on UpdateEntryUnion {
    __typename
    ... on UpdateEntryErrors {
      errors {
        ...UpdateEntryErrorFragment
      }
    }
    ... on UpdateEntrySomeSuccess {
      entry {
        ...UpdateEntryFragment
      }
    }
  }
  ${UPDATE_ENTRY_ERROR_FRAGMENT}
  ${UPDATE_ENTRY_FRAGMENT}
`;

const UPDATE_EXPERIENCE_FRAGMENT = gql`
  fragment UpdateExperienceFragment on UpdateExperience {
    experienceId
    updatedAt
    ownFields {
      ...UpdateExperienceOwnFieldsUnionFragment
    }
    updatedDefinitions {
      ...UpdateDefinitionUnionFragment
    }
    updatedEntries {
      ...UpdateEntryUnionFragment
    }
    newEntries {
      __typename
      ... on CreateEntryErrors {
        ...CreateEntryErrorsFragment
      }
      ... on CreateEntrySuccess {
        ...CreateEntrySuccessFragment
      }
    }
    deletedEntries {
      __typename
      ... on EntrySuccess {
        entry {
          ...EntryFragment
        }
      }
      ... on DeleteEntryErrors {
        errors {
          id
          error
        }
      }
    }
  }
  ${UPDATE_EXPERIENCE_OWN_FIELDS_UNION_FRAGMENT}
  ${UPDATE_DEFINITION_UNION_FRAGMENT}
  ${UPDATE_ENTRY_UNION_FRAGMENT}
  ${CREATE_ENTRY_SUCCESS_FRAGMENT}
  ${CREATE_ENTRY_ERRORS_FRAGMENT}
  ${ENTRY_FRAGMENT}
`;

const UPDATE_EXPERIENCE_SOME_SUCCESS_FRAGMENT = gql`
  fragment UpdateExperienceSomeSuccessFragment on UpdateExperienceSomeSuccess {
    experience {
      ...UpdateExperienceFragment
    }
  }
  ${UPDATE_EXPERIENCE_FRAGMENT}
`;

const UPDATE_EXPERIENCES_ONLINE_MUTATION = gql`
  mutation UpdateExperiencesOnline($input: [UpdateExperienceInput!]!) {
    updateExperiences(input: $input) {
      __typename
      ... on UpdateExperiencesAllFail {
        error
      }
      ... on UpdateExperiencesSomeSuccess {
        experiences {
          __typename
          ... on UpdateExperienceErrors {
            errors {
              ...UpdateExperienceErrorFragment
            }
          }
          ... on UpdateExperienceSomeSuccess {
            ...UpdateExperienceSomeSuccessFragment
          }
        }
      }
    }
  }
  ${UPDATE_EXPERIENCE_ERROR_FRAGMENT}
  ${UPDATE_EXPERIENCE_SOME_SUCCESS_FRAGMENT}
`;

export function useUpdateExperiencesOnlineMutation(): UseUpdateExperiencesOnlineMutation {
  return useMutation(UPDATE_EXPERIENCES_ONLINE_MUTATION);
}

export async function updateExperiencesOnlineEffectHelperFunc(
  input: UpdateExperienceInput[],
  updateExperiencesOnline: UpdateExperiencesOnlineMutationFn,
  onUpdateSuccess: (arg: UpdateExperienceFragment) => void,
  onError: (error?: CommonError) => void,
  onDone?: () => void,
) {
  try {
    const response = await updateExperiencesOnline({
      variables: {
        input,
      },

      update: updateExperiencesInCache(onDone),
    });

    const validResponse =
      response && response.data && response.data.updateExperiences;

    if (!validResponse) {
      onError();
      return;
    }

    if (validResponse.__typename === "UpdateExperiencesAllFail") {
      onError(validResponse.error);
    } else {
      const updateResult = validResponse.experiences[0];

      if (updateResult.__typename === "UpdateExperienceErrors") {
        onError(updateResult.errors.error);
      } else {
        const { experience } = updateResult;
        onUpdateSuccess(experience);
      }
    }
  } catch (errors) {
    onError(errors);
  }
}

export type UpdateExperiencesOnlineMutationFn = MutationFunction<
  UpdateExperiencesOnline,
  UpdateExperiencesOnlineVariables
>;

export type UpdateExperiencesOnlineMutationResult = ExecutionResult<
  UpdateExperiencesOnline
>;

// used to type check test mock calls
export type UpdateExperiencesOnlineMutationFnOptions = MutationFunctionOptions<
  UpdateExperiencesOnline,
  UpdateExperiencesOnlineVariables
>;

export type UseUpdateExperiencesOnlineMutation = [
  UpdateExperiencesOnlineMutationFn,
  MutationResult<UpdateExperiencesOnline>,
];

// component's props should extend this
export interface UpdateExperiencesOnlineComponentProps {
  updateExperiencesOnline: UpdateExperiencesOnlineMutationFn;
}

////////////////////////// END UPDATE EXPERIENCES SECTION //////////////////

////////////////////////// START CREATE EXPERIENCES SECTION ////////////////////

export const CREATE_EXPERIENCES_MUTATION = gql`
  mutation CreateExperiences(
    $input: [CreateExperienceInput!]!
    $entriesPagination: PaginationInput!
  ) {
    createExperiences(input: $input) {
      __typename
      ... on ExperienceSuccess {
        experience {
          ...ExperienceFragment
        }
        entriesErrors {
          ...CreateEntryErrorFragment
        }
      }
      ... on CreateExperienceErrors {
        errors {
          meta {
            index
            clientId
          }
          error
          title
          user
          clientId
          dataDefinitions {
            index
            name
            type
          }
        }
      }
    }
  }
  ${EXPERIENCE_FRAGMENT}
  ${CREATE_ENTRY_ERROR_FRAGMENT}
`;

export function useCreateExperiencesMutation(): UseCreateExperiencesMutation {
  return useMutation(CREATE_EXPERIENCES_MUTATION);
}

type CreateExperiencesMutationFn = MutationFunction<
  CreateExperiences,
  CreateExperiencesVariables
>;

// used to type check test mock resolved value
export type CreateExperiencesMutationResult = ExecutionResult<
  CreateExperiences
>;

// used to type check test mock calls
export type CreateExperiencesMutationFnOptions = MutationFunctionOptions<
  CreateExperiences,
  CreateExperiencesVariables
>;

type UseCreateExperiencesMutation = [
  CreateExperiencesMutationFn,
  MutationResult<CreateExperiences>,
];

// component's props should extend this
export interface CreateExperiencesComponentProps {
  createExperiences: CreateExperiencesMutationFn;
}

////////////////////////// END CREATE EXPERIENCES SECTION ///////////////

////////////////////////// DELETE EXPERIENCES SECTION ///////////////

export const DELETE_EXPERIENCES_MUTATION = gql`
  mutation DeleteExperiences($input: [ID!]!) {
    deleteExperiences(input: $input) {
      ... on DeleteExperiencesAllFail {
        error
      }
      ... on DeleteExperiencesSomeSuccess {
        experiences {
          ... on DeleteExperienceErrors {
            errors {
              id
              error
            }
          }
          ... on DeleteExperienceSuccess {
            experience {
              id
            }
          }
        }
      }
    }
  }
`;

export function useDeleteExperiencesMutation(): UseDeleteExperiencesMutation {
  return useMutation(DELETE_EXPERIENCES_MUTATION);
}

export type DeleteExperiencesMutationFn = MutationFunction<
  DeleteExperiences,
  DeleteExperiencesVariables
>;

// used to type check test fake mutation function return value e.g. {data: {result: {}}}
export type DeleteExperiencesMutationResult = ExecutionResult<
  DeleteExperiences
>;

// used to type check test fake function calls arguments
export type DeleteExperiencesMutationFnOptions = MutationFunctionOptions<
  DeleteExperiences,
  DeleteExperiencesVariables
>;

export type UseDeleteExperiencesMutation = [
  DeleteExperiencesMutationFn,
  MutationResult<DeleteExperiences>,
];

// component's props should extend this
export interface DeleteExperiencesComponentProps {
  deleteExperiences: DeleteExperiencesMutationFn;
}

////////////////////////// END DELETE EXPERIENCES SECTION ////////////

import gql from "graphql-tag";
import { EXPERIENCE_NO_ENTRY_FRAGMENT } from "./experience.fragment";
import {
  UpdateExperienceMutation,
  UpdateExperienceMutationVariables,
} from "./apollo-types/UpdateExperienceMutation";
import { MutationFunction } from "@apollo/react-common";
import { DEFINITION_FRAGMENT } from "./data-definition.fragment";
import { UPDATE_ENTRY_UNION_FRAGMENT } from "./update-definition-and-data.mutation";
import { useMutation } from "@apollo/react-hooks";
import {
  MutationFunctionOptions,
  MutationResult,
  ExecutionResult,
} from "@apollo/react-common";
import {
  UpdateExperiencesOnline,
  UpdateExperiencesOnlineVariables,
} from "./apollo-types/UpdateExperiencesOnline";
import { ENTRY_FRAGMENT } from "./entry.fragment";

export const UPDATE_EXPERIENCE_MUTATION = gql`
  mutation UpdateExperienceMutation($input: UpdateExperienceInput!) {
    updateExperience(input: $input) {
      experience {
        ...ExperienceNoEntryFragment
      }

      errors {
        title
        clientId
      }
    }
  }

  ${EXPERIENCE_NO_ENTRY_FRAGMENT}
`;

export type UpdateExperienceMutationFn = MutationFunction<
  UpdateExperienceMutation,
  UpdateExperienceMutationVariables
>;

export interface UpdateExperienceMutationProps {
  updateExperience: UpdateExperienceMutationFn;
}

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

const UPDATE_DEFINITION_UNION_FRAGMENT = gql`
  fragment UpdateDefinitionUnionFragment on UpdateDefinition {
    __typename
    ... on DefinitionErrors {
      errors {
        ...DefinitionErrorFragment
      }
    }

    ... on DefinitionSuccess {
      definition {
        ...DataDefinitionFragment
      }
    }
  }
  ${DEFINITION_ERROR_FRAGMENT}
  ${DEFINITION_FRAGMENT}
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
      ... on CreateEntryErrorss {
        errors {
          meta {
            index
            clientId
          }
          error
          clientId
          experienceId
          dataObjects {
            index
            definition
            definitionId
            data
            clientId
          }
        }
      }
      ... on CreateEntrySuccess {
        entry {
          ...EntryFragment
        }
      }
    }
  }
  ${UPDATE_EXPERIENCE_OWN_FIELDS_UNION_FRAGMENT}
  ${UPDATE_DEFINITION_UNION_FRAGMENT}
  ${UPDATE_ENTRY_UNION_FRAGMENT}
  ${ENTRY_FRAGMENT}
`;

export const UPDATE_EXPERIENCES_ONLINE_MUTATION = gql`
  mutation UpdateExperiencesOnline($input: [UpdateAnExperienceInput!]!) {
    updateExperiences(input: $input) {
      __typename
      ... on UpdateExperiencesAllFail {
        error
      }

      ... on UpdateExperiencesSomeSuccess {
        experiences {
          __typename

          ... on UpdateExperienceFullErrors {
            errors {
              ...UpdateExperienceErrorFragment
            }
          }

          ... on UpdateExperienceSomeSuccess {
            experience {
              ...UpdateExperienceFragment
            }
          }
        }
      }
    }
  }
  ${UPDATE_EXPERIENCE_ERROR_FRAGMENT}
  ${UPDATE_EXPERIENCE_FRAGMENT}
`;

export function useUpdateExperiencesOnlineMutation(): UseUpdateExperiencesOnlineMutation {
  return useMutation(UPDATE_EXPERIENCES_ONLINE_MUTATION);
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

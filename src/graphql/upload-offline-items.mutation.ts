import gql from "graphql-tag";
import { useMutation } from "@apollo/react-hooks";
import { ENTRY_CONNECTION_FRAGMENT } from "./entry-connection.fragment";
import {
  CREATE_ENTRIES_RESPONSE_FRAGMENT,
  CREATE_ENTRIES_ERROR_FRAGMENT,
} from "./create-entries-response.fragment";
import {
  UploadOfflineItemsMutation,
  UploadOfflineItemsMutationVariables,
} from "./apollo-types/UploadOfflineItemsMutation";
import { EXPERIENCE_NO_ENTRY_FRAGMENT } from "./experience.fragment";
import { CREATE_EXPERIENCE_ERRORS } from "./create-experience-errors.fragment";
import { MutationFunction, MutationFetchResult } from "@apollo/react-common";
import {
  UploadOfflineExperiencesMutation,
  UploadOfflineExperiencesMutationVariables,
} from "./apollo-types/UploadOfflineExperiencesMutation";

const UPLOAD_OFFLINE_EXPERIENCES_EXPERIENCE_ERROR_FRAGMENT = gql`
  fragment UploadOfflineExperienceErrorFragment on CreateOfflineExperienceErrors {
    clientId
    index
    errors {
      ...CreateExperienceErrorsFragment
    }
  }

  ${CREATE_EXPERIENCE_ERRORS}
`;

const UPLOAD_OFFLINE_EXPERIENCES_FRAGMENT = gql`
  fragment UploadOfflineExperiencesFragment on OfflineExperience {
    experience {
      ...ExperienceNoEntryFragment

      entries(pagination: { first: 20000 }) {
        ...EntryConnectionFragment
      }
    }

    experienceErrors {
      ...UploadOfflineExperienceErrorFragment
    }

    entriesErrors {
      ...CreateEntriesErrorsFragment
    }
  }

  ${EXPERIENCE_NO_ENTRY_FRAGMENT}
  ${ENTRY_CONNECTION_FRAGMENT}
  ${CREATE_ENTRIES_ERROR_FRAGMENT}
  ${UPLOAD_OFFLINE_EXPERIENCES_EXPERIENCE_ERROR_FRAGMENT}
`;

export const UPLOAD_OFFLINE_EXPERIENCES_MUTATION = gql`
  mutation UploadOfflineExperiencesMutation($input: [CreateExperienceInput!]!) {
    saveOfflineExperiences(input: $input) {
      ...UploadOfflineExperiencesFragment
    }
  }

  ${UPLOAD_OFFLINE_EXPERIENCES_FRAGMENT}
`;

export const UPLOAD_OFFLINE_ITEMS_MUTATION = gql`
  mutation UploadOfflineItemsMutation(
    $offlineExperiencesInput: [CreateExperienceInput!]!
    $offlineEntriesInput: [CreateEntriesInput!]!
  ) {
    saveOfflineExperiences(input: $offlineExperiencesInput) {
      ...UploadOfflineExperiencesFragment
    }

    createEntries(input: $offlineEntriesInput) {
      ...CreateEntriesResponseFragment
    }
  }

  ${UPLOAD_OFFLINE_EXPERIENCES_FRAGMENT}
  ${CREATE_ENTRIES_RESPONSE_FRAGMENT}
`;

export const MUTATION_NAME_saveOfflineExperiences = "saveOfflineExperiences";

export function useUploadOfflineItemsMutation(): UseUploadOfflineItemsMutation {
  return useMutation(UPLOAD_OFFLINE_ITEMS_MUTATION);
}

// component props should extend this
export interface UseUploadOfflineItemsMutationProps {
  uploadAllOfflineItems: UseUploadOfflineItemsMutationFn;
}

type UseUploadOfflineItemsMutation = [
  UseUploadOfflineItemsMutationFn,
  UseUploadOfflineItemsMutationFnResult,
];

type UseUploadOfflineItemsMutationFn = MutationFunction<
  UploadOfflineItemsMutation,
  UploadOfflineItemsMutationVariables
>;

type UseUploadOfflineItemsMutationFnResult = MutationFetchResult<
  UploadOfflineItemsMutation
>;

export function useUploadOfflineExperiencesMutation(): UseUploadOfflineExperiencesMutation {
  return useMutation(UPLOAD_OFFLINE_EXPERIENCES_MUTATION);
}

export interface UseUploadOfflineExperiencesMutationProps {
  uploadOfflineExperiences: UseUploadOfflineExperiencesMutationFn;
}

export type UseUploadOfflineExperiencesMutationFn = MutationFunction<
  UploadOfflineExperiencesMutation,
  UploadOfflineExperiencesMutationVariables
>;

type UseUploadOfflineExperiencesMutation = [
  UseUploadOfflineExperiencesMutationFn,
  UseUploadOfflineExperiencesMutationResult,
];

type UseUploadOfflineExperiencesMutationResult = MutationFetchResult<
  UploadOfflineExperiencesMutation
>;

import gql from "graphql-tag";
import { ENTRY_CONNECTION_FRAGMENT } from "./entry-connection.fragment";
import {
  UploadUnsavedExperiencesMutation,
  UploadUnsavedExperiencesMutationVariables
} from "./apollo-types/UploadUnsavedExperiencesMutation";
import { MutationFn, FetchResult } from "react-apollo";
import {
  CREATE_ENTRIES_RESPONSE_FRAGMENT,
  CREATE_ENTRIES_ERROR_FRAGMENT
} from "./create-entries-response.fragment";
import {
  UploadAllUnsavedsMutation,
  UploadAllUnsavedsMutationVariables
} from "./apollo-types/UploadAllUnsavedsMutation";
import { EXPERIENCE_NO_ENTRY_FRAGMENT } from "./experience.fragment";

const UPLOAD_UNSAVED_EXPERIENCES_EXPERIENCE_ERROR_FRAGMENT = gql`
  fragment UploadUnsavedExperiencesExperienceErrorFragment on OfflineExperienceError {
    clientId
    error
  }
`;

const UPLOAD_UNSAVED_EXPERIENCES_FRAGMENT = gql`
  fragment UploadUnsavedExperiencesFragment on OfflineExperience {
    experience {
      ...ExperienceNoEntryFragment

      entries {
        ...EntryConnectionFragment
      }
    }

    experienceError {
      ...UploadUnsavedExperiencesExperienceErrorFragment
    }

    entriesErrors {
      ...CreateEntriesErrorFragment
    }
  }

  ${EXPERIENCE_NO_ENTRY_FRAGMENT}
  ${ENTRY_CONNECTION_FRAGMENT}
  ${CREATE_ENTRIES_ERROR_FRAGMENT}
  ${UPLOAD_UNSAVED_EXPERIENCES_EXPERIENCE_ERROR_FRAGMENT}
`;

export const UPLOAD_UNSAVED_EXPERIENCES_MUTATION = gql`
  mutation UploadUnsavedExperiencesMutation($input: [CreateExperienceInput!]!) {
    saveOfflineExperiences(input: $input) {
      ...UploadUnsavedExperiencesFragment
    }
  }

  ${UPLOAD_UNSAVED_EXPERIENCES_FRAGMENT}
`;

export const UPLOAD_ALL_UNSAVEDS_MUTATION = gql`
  mutation UploadAllUnsavedsMutation(
    $unsavedExperiences: [CreateExperienceInput!]!
    $unsavedEntries: [CreateEntryInput!]!
  ) {
    saveOfflineExperiences(input: $unsavedExperiences) {
      ...UploadUnsavedExperiencesFragment
    }

    createEntries(createEntries: $unsavedEntries) {
      ...CreateEntriesResponseFragment
    }
  }

  ${UPLOAD_UNSAVED_EXPERIENCES_FRAGMENT}
  ${CREATE_ENTRIES_RESPONSE_FRAGMENT}
`;

export type UploadUnsavedExperiencesMutationFn = MutationFn<
  UploadUnsavedExperiencesMutation,
  UploadUnsavedExperiencesMutationVariables
>;

export interface UploadUnsavedExperiencesMutationProps {
  uploadUnsavedExperiences: UploadUnsavedExperiencesMutationFn;
}

export type UploadAllUnsavedsMutationFn = MutationFn<
  UploadAllUnsavedsMutation,
  UploadAllUnsavedsMutationVariables
>;

export interface UploadAllUnsavedsMutationProps {
  uploadAllUnsaveds: UploadAllUnsavedsMutationFn;
}

export type UploadAllUnsavedsMutationFnResult = FetchResult<
  UploadAllUnsavedsMutation
>;

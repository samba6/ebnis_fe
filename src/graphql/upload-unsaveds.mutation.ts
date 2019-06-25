import gql from "graphql-tag";
import { ENTRY_CONNECTION_FRAGMENT } from "./entry-connection.fragment";
import {
  UploadUnsavedExperiencesMutation,
  UploadUnsavedExperiencesMutationVariables
} from "./apollo-types/UploadUnsavedExperiencesMutation";
import { MutationFn, FetchResult } from "react-apollo";
import { CREATE_ENTRIES_RESPONSE_FRAGMENT } from "./create-entries-response.fragment";
import {
  UploadAllUnsavedsMutation,
  UploadAllUnsavedsMutationVariables
} from "./apollo-types/UploadAllUnsavedsMutation";
import { EXPERIENCE_NO_ENTRY_FRAGMENT } from "./experience.fragment";

const UPLOAD_UNSAVED_EXPERIENCES_FRAGMENT = gql`
  fragment UploadUnsavedExperiencesFragment on OfflineExperienceSync {
    experience {
      ...ExperienceNoEntryFragment

      entries {
        ...EntryConnectionFragment
      }
    }

    experienceError {
      index
      clientId
      error
    }

    entriesErrors {
      experienceId
      clientId
      error
    }
  }

  ${EXPERIENCE_NO_ENTRY_FRAGMENT}
  ${ENTRY_CONNECTION_FRAGMENT}
`;

export const UPLOAD_UNSAVED_EXPERIENCES_MUTATION = gql`
  mutation UploadUnsavedExperiencesMutation($input: [CreateExp!]!) {
    syncOfflineExperiences(input: $input) {
      ...UploadUnsavedExperiencesFragment
    }
  }

  ${UPLOAD_UNSAVED_EXPERIENCES_FRAGMENT}
`;

export const UPLOAD_ALL_UNSAVEDS_MUTATION = gql`
  mutation UploadAllUnsavedsMutation(
    $unsavedExperiences: [CreateExp!]!
    $unsavedEntries: [CreateEntry!]!
  ) {
    syncOfflineExperiences(input: $unsavedExperiences) {
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

import gql from "graphql-tag";
import { ENTRY_CONNECTION_FRAGMENT } from "./entry-connection.fragment";
import {
  CREATE_ENTRIES_RESPONSE_FRAGMENT,
  CREATE_ENTRIES_ERROR_FRAGMENT,
} from "./create-entries-response.fragment";
import {
  UploadAllUnsavedsMutation,
  UploadAllUnsavedsMutationVariables,
} from "./apollo-types/UploadAllUnsavedsMutation";
import { EXPERIENCE_NO_ENTRY_FRAGMENT } from "./experience.fragment";
import { CREATE_EXPERIENCE_ERRORS } from "./create-experience-errors.fragment";
import { MutationFunction, MutationFetchResult } from "react-apollo";

const UPLOAD_UNSAVED_EXPERIENCES_EXPERIENCE_ERROR_FRAGMENT = gql`
  fragment UploadUnsavedExperiencesExperienceErrorFragment on CreateOfflineExperienceErrors {
    clientId
    index
    errors {
      ...CreateExperienceErrorsFragment
    }
  }

  ${CREATE_EXPERIENCE_ERRORS}
`;

const UPLOAD_UNSAVED_EXPERIENCES_FRAGMENT = gql`
  fragment UploadUnsavedExperiencesFragment on OfflineExperience {
    experience {
      ...ExperienceNoEntryFragment

      entries(pagination: { first: 100 }) {
        ...EntryConnectionFragment
      }
    }

    experienceErrors {
      ...UploadUnsavedExperiencesExperienceErrorFragment
    }

    entriesErrors {
      ...CreateEntriesErrorsFragment
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
    $unsavedExperiencesInput: [CreateExperienceInput!]!
    $unsavedEntriesInput: [CreateEntriesInput!]!
  ) {
    saveOfflineExperiences(input: $unsavedExperiencesInput) {
      ...UploadUnsavedExperiencesFragment
    }

    createEntries(input: $unsavedEntriesInput) {
      ...CreateEntriesResponseFragment
    }
  }

  ${UPLOAD_UNSAVED_EXPERIENCES_FRAGMENT}
  ${CREATE_ENTRIES_RESPONSE_FRAGMENT}
`;

export type UploadAllUnsavedsMutationFn = MutationFunction<
  UploadAllUnsavedsMutation,
  UploadAllUnsavedsMutationVariables
>;

export type UploadAllUnsavedsMutationFnResult = MutationFetchResult<
  UploadAllUnsavedsMutation
>;

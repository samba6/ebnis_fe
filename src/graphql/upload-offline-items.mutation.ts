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
import { MutationFunction, MutationFetchResult } from "@apollo/react-common";

const UPLOAD_OFFLINE_EXPERIENCES_EXPERIENCE_ERROR_FRAGMENT = gql`
  fragment UploadUnsavedExperiencesExperienceErrorFragment on CreateOfflineExperienceErrors {
    clientId
    index
    errors {
      ...CreateExperienceErrorsFragment
    }
  }

  ${CREATE_EXPERIENCE_ERRORS}
`;

const UPLOAD_OFFLINE_EXPERIENCES_FRAGMENT = gql`
  fragment UploadUnsavedExperiencesFragment on OfflineExperience {
    experience {
      ...ExperienceNoEntryFragment

      entries(pagination: { first: 2000 }) {
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
  ${UPLOAD_OFFLINE_EXPERIENCES_EXPERIENCE_ERROR_FRAGMENT}
`;

export const UPLOAD_OFFLINE_EXPERIENCES_MUTATION = gql`
  mutation UploadUnsavedExperiencesMutation($input: [CreateExperienceInput!]!) {
    saveOfflineExperiences(input: $input) {
      ...UploadUnsavedExperiencesFragment
    }
  }

  ${UPLOAD_OFFLINE_EXPERIENCES_FRAGMENT}
`;

export const UPLOAD_OFFLINE_ITEMS_MUTATION = gql`
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

  ${UPLOAD_OFFLINE_EXPERIENCES_FRAGMENT}
  ${CREATE_ENTRIES_RESPONSE_FRAGMENT}
`;

export type UploadOfflineItemsMutationFn = MutationFunction<
  UploadAllUnsavedsMutation,
  UploadAllUnsavedsMutationVariables
>;

export type UploadAllUnsavedsMutationFnResult = MutationFetchResult<
  UploadAllUnsavedsMutation
>;

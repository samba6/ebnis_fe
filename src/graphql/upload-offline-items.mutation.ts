import gql from "graphql-tag";
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

      entries(pagination: { first: 2000 }) {
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

export type UploadOfflineItemsMutationFn = MutationFunction<
  UploadOfflineItemsMutation,
  UploadOfflineItemsMutationVariables
>;

export type UploadOfflineItemsMutationFnResult = MutationFetchResult<
  UploadOfflineItemsMutation
>;

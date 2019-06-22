import gql from "graphql-tag";
import { EXPERIENCE_NO_ENTRY_FRAGMENT } from "./experience-no-entry.fragment";
import { ENTRY_CONNECTION_FRAGMENT } from "./entry-connection.fragment";
import {
  UploadUnsavedExperiencesMutation,
  UploadUnsavedExperiencesMutationVariables
} from "./apollo-types/UploadUnsavedExperiencesMutation";
import { MutationFn } from "react-apollo";

export const UPLOAD_UNSAVED_EXPERIENCES_MUTATION = gql`
  mutation UploadUnsavedExperiencesMutation($input: [CreateExp!]!) {
    syncOfflineExperiences(input: $input) {
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
  }

  ${EXPERIENCE_NO_ENTRY_FRAGMENT}
  ${ENTRY_CONNECTION_FRAGMENT}
`;

export type UploadUnsavedExperiencesMutationFn = MutationFn<
  UploadUnsavedExperiencesMutation,
  UploadUnsavedExperiencesMutationVariables
>;

export interface UploadUnsavedExperiencesMutationProps {
  uploadUnsavedExperiences: UploadUnsavedExperiencesMutationFn;
}

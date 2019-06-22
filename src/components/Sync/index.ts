import { Sync as Comp } from "./component";
import { compose, graphql } from "react-apollo";
import {
  savedExperiencesUnSavedEntriesGql,
  unSavedExperiencesGql
} from "../../state/sync-unsaved-resolver";
import {
  UPLOAD_UNSAVED_EXPERIENCES_MUTATION,
  UploadUnsavedExperiencesMutationProps
} from "../../graphql/upload-offline-experiences.mutation";
import {
  UploadUnsavedExperiencesMutation,
  UploadUnsavedExperiencesMutationVariables
} from "../../graphql/apollo-types/UploadUnsavedExperiencesMutation";
import {
  CREATE_ENTRIES_MUTATION,
  CreateEntriesMutationGqlProps
} from "../../graphql/create-entries.mutation";
import {
  CreateEntriesMutation,
  CreateEntriesMutationVariables
} from "../../graphql/apollo-types/CreateEntriesMutation";

const uploadUnsavedExperiencesGql = graphql<
  {},
  UploadUnsavedExperiencesMutation,
  UploadUnsavedExperiencesMutationVariables,
  UploadUnsavedExperiencesMutationProps | undefined
>(UPLOAD_UNSAVED_EXPERIENCES_MUTATION, {
  props: ({ mutate }) =>
    mutate && {
      uploadUnsavedExperiences: mutate
    }
});

const uploadSavedExperiencesUnsavedEntriesGql = graphql<
  {},
  CreateEntriesMutation,
  CreateEntriesMutationVariables,
  CreateEntriesMutationGqlProps | undefined
>(CREATE_ENTRIES_MUTATION, {
  props: ({ mutate }) =>
    mutate && {
      createEntries: mutate
    }
});

export const Sync = compose(
  savedExperiencesUnSavedEntriesGql,
  unSavedExperiencesGql,
  uploadUnsavedExperiencesGql,
  uploadSavedExperiencesUnsavedEntriesGql
)(Comp);

export default Sync;

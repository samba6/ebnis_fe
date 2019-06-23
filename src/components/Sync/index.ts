import { Sync as Comp } from "./component";
import { compose, graphql, withApollo } from "react-apollo";
import {
  savedExperiencesUnSavedEntriesGql,
  unSavedExperiencesGql
} from "../../state/sync-unsaved-resolver";
import {
  UPLOAD_UNSAVED_EXPERIENCES_MUTATION,
  UploadUnsavedExperiencesMutationProps,
  UPLOAD_ALL_UNSAVEDS_MUTATION,
  UploadAllUnsavedsMutationProps
} from "../../graphql/upload-unsaveds.mutation";
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
import {
  UploadAllUnsavedsMutation,
  UploadAllUnsavedsMutationVariables
} from "../../graphql/apollo-types/UploadAllUnsavedsMutation";

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

const uploadAllUnsavedsGql = graphql<
  {},
  UploadAllUnsavedsMutation,
  UploadAllUnsavedsMutationVariables,
  UploadAllUnsavedsMutationProps | undefined
>(UPLOAD_ALL_UNSAVEDS_MUTATION, {
  props: ({ mutate }) =>
    mutate && {
      uploadAllUnsaveds: mutate
    }
});

export const Sync = compose(
  savedExperiencesUnSavedEntriesGql,
  unSavedExperiencesGql,
  uploadUnsavedExperiencesGql,
  uploadSavedExperiencesUnsavedEntriesGql,
  uploadAllUnsavedsGql,
  withApollo
)(Comp);

export default Sync;

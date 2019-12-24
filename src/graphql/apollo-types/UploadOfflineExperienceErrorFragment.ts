/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL fragment: UploadOfflineExperienceErrorFragment
// ====================================================

export interface UploadUnsavedExperiencesExperienceErrorFragment_errors_dataDefinitionsErrors_errors {
  __typename: "DataDefinitionError";
  name: string | null;
  type: string | null;
}

export interface UploadUnsavedExperiencesExperienceErrorFragment_errors_dataDefinitionsErrors {
  __typename: "DataDefinitionErrors";
  index: number;
  errors: UploadUnsavedExperiencesExperienceErrorFragment_errors_dataDefinitionsErrors_errors;
}

export interface UploadUnsavedExperiencesExperienceErrorFragment_errors {
  __typename: "CreateExperienceErrors";
  clientId: string | null;
  title: string | null;
  user: string | null;
  dataDefinitionsErrors: (UploadUnsavedExperiencesExperienceErrorFragment_errors_dataDefinitionsErrors | null)[] | null;
}

export interface UploadOfflineExperienceErrorFragment {
  __typename: "CreateOfflineExperienceErrors";
  /**
   * The client ID of the failing experience. As user may not have provided a
   *   client ID, this field is nullable and in that case, the index field will
   *   be used to identify this error
   */
  clientId: string;
  /**
   * The index of the failing experience in the list of experiences input
   */
  index: number;
  /**
   * The error object representing the insert failure reasons
   */
  errors: UploadUnsavedExperiencesExperienceErrorFragment_errors;
}

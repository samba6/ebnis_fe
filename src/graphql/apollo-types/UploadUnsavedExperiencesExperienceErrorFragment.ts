/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL fragment: UploadUnsavedExperiencesExperienceErrorFragment
// ====================================================

export interface UploadUnsavedExperiencesExperienceErrorFragment {
  __typename: "OfflineExperienceError";
  /**
   * The client ID of the failing experience. As user may not have provided a
   *   client ID, this field is nullable and in that case, the index field will
   *   be used to identify this error
   */
  clientId: string | null;
  /**
   * The error string explaining why experience fails to insert.
   */
  error: string;
}

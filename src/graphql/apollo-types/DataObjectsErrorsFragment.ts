/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL fragment: DataObjectsErrorsFragment
// ====================================================

export interface DataObjectsErrorsFragment_errors {
  __typename: "DataObjectError";
  data: string | null;
  definition: string | null;
  definitionId: string | null;
}

export interface DataObjectsErrorsFragment {
  __typename: "DataObjectsErrors";
  index: number;
  errors: DataObjectsErrorsFragment_errors;
}

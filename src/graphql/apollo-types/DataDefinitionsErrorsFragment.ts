/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL fragment: DataDefinitionsErrorsFragment
// ====================================================

export interface DataDefinitionsErrorsFragment_errors {
  __typename: "DataDefinitionError";
  name: string | null;
  type: string | null;
}

export interface DataDefinitionsErrorsFragment {
  __typename: "DataDefinitionErrors";
  index: number;
  errors: DataDefinitionsErrorsFragment_errors;
}

/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL fragment: DataObjectFullErrorFragment
// ====================================================

export interface DataObjectFullErrorFragment {
  __typename: "DataObjectFullError";
  id: string;
  definition: string | null;
  definitionId: string | null;
  clientId: string | null;
  /**
   * For generic errors unrelated to the fields of the data object e.g.
   *   not found error
   */
  error: string | null;
  /**
   * Error related to the data e.g. a string was supplied for a decimal field.
   */
  data: string | null;
}

/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL fragment: CreateEntryErrorsFragment
// ====================================================

export interface CreateEntryErrorsFragment_errors_meta {
  __typename: "CreateEntryErrorMeta";
  experienceId: string;
  index: number;
  clientId: string | null;
}

export interface CreateEntryErrorsFragment_errors_dataObjects_meta {
  __typename: "DataObjectErrorMeta";
  index: number;
  id: string | null;
  clientId: string | null;
}

export interface CreateEntryErrorsFragment_errors_dataObjects {
  __typename: "DataObjectError";
  meta: CreateEntryErrorsFragment_errors_dataObjects_meta;
  definition: string | null;
  definitionId: string | null;
  clientId: string | null;
  /**
   * Error related to the data e.g. a string was supplied for a decimal field.
   */
  data: string | null;
}

export interface CreateEntryErrorsFragment_errors {
  __typename: "CreateEntryError";
  meta: CreateEntryErrorsFragment_errors_meta;
  /**
   * A catch-all field for when we are unable to create an entry
   */
  error: string | null;
  /**
   * May be we failed because entry.clientId is already taken by another
   *   entry belonging to the experience.
   */
  clientId: string | null;
  /**
   * An offline entry of offline experience must have its experience ID same as
   *   experience.clientId.
   */
  experienceId: string | null;
  /**
   * Did we fail because there are errors in the data object object?
   */
  dataObjects: (CreateEntryErrorsFragment_errors_dataObjects | null)[] | null;
}

export interface CreateEntryErrorsFragment {
  __typename: "CreateEntryErrors";
  errors: CreateEntryErrorsFragment_errors;
}

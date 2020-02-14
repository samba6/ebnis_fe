/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL fragment: CreateEntryErrorssFragment
// ====================================================

export interface CreateEntryErrorssFragment_errors_meta {
  __typename: "CreateEntryErrorMeta";
  experienceId: string;
  index: number;
  clientId: string | null;
}

export interface CreateEntryErrorssFragment_errors_dataObjects {
  __typename: "DataObjectErrorx";
  index: number;
  definition: string | null;
  definitionId: string | null;
  data: string | null;
  clientId: string | null;
}

export interface CreateEntryErrorssFragment_errors {
  __typename: "CreateEntryErrorx";
  meta: CreateEntryErrorssFragment_errors_meta;
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
  dataObjects: (CreateEntryErrorssFragment_errors_dataObjects | null)[] | null;
}

export interface CreateEntryErrorssFragment {
  __typename: "CreateEntryErrorss";
  errors: CreateEntryErrorssFragment_errors;
}

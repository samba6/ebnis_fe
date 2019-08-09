/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL fragment: CreateEntriesErrorsFragment
// ====================================================

export interface CreateEntriesErrorsFragment_errors_dataObjectsErrors_errors {
  __typename: "DataObjectError";
  data: string | null;
  definition: string | null;
  definitionId: string | null;
}

export interface CreateEntriesErrorsFragment_errors_dataObjectsErrors {
  __typename: "DataObjectsErrors";
  index: number;
  errors: CreateEntriesErrorsFragment_errors_dataObjectsErrors_errors;
}

export interface CreateEntriesErrorsFragment_errors {
  __typename: "CreateEntryErrors";
  /**
   * May be because client ID is not unique for experience
   */
  clientId: string | null;
  /**
   * A catch-all field for when we are unable to create an entry
   */
  entry: string | null;
  /**
   * While saving an offline entry, its experience ID must be same as
   *   experience.clientId if saving entry via offline experience
   */
  experienceId: string | null;
  /**
   * Did we fail because, say, we did could not fetch the experience
   */
  experience: string | null;
  /**
   * Did we fail because there are errors in the data object object?
   */
  dataObjectsErrors: (CreateEntriesErrorsFragment_errors_dataObjectsErrors | null)[] | null;
}

export interface CreateEntriesErrorsFragment {
  __typename: "CreateEntriesErrors";
  /**
   * The experience ID of the entry which fails to save
   */
  experienceId: string;
  /**
   * The client ID of the entry which fails to save
   */
  clientId: string;
  errors: CreateEntriesErrorsFragment_errors;
}

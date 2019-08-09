/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

import { CreateEntriesInput } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: CreateEntriesMutation
// ====================================================

export interface CreateEntriesMutation_createEntries_entries_dataObjects {
  __typename: "DataObject";
  id: string;
  data: any;
  definitionId: string;
}

export interface CreateEntriesMutation_createEntries_entries {
  __typename: "Entry";
  /**
   * The ID of an object
   */
  id: string;
  /**
   * The ID of experience to which this entry belongs.
   */
  experienceId: string;
  /**
   * The client ID which indicates that an entry has been created while server
   *   is offline and is to be saved. The client ID uniquely
   *   identifies this entry and will be used prevent conflict while saving entry
   *   created offline and must thus be non null in this situation.
   */
  clientId: string | null;
  insertedAt: any;
  updatedAt: any;
  /**
   * The list of data belonging to this entry
   */
  dataObjects: (CreateEntriesMutation_createEntries_entries_dataObjects | null)[];
}

export interface CreateEntriesMutation_createEntries_errors_errors_dataObjectsErrors_errors {
  __typename: "DataObjectError";
  data: string | null;
  definition: string | null;
  definitionId: string | null;
}

export interface CreateEntriesMutation_createEntries_errors_errors_dataObjectsErrors {
  __typename: "DataObjectsErrors";
  index: number;
  errors: CreateEntriesMutation_createEntries_errors_errors_dataObjectsErrors_errors;
}

export interface CreateEntriesMutation_createEntries_errors_errors {
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
  dataObjectsErrors: (CreateEntriesMutation_createEntries_errors_errors_dataObjectsErrors | null)[] | null;
}

export interface CreateEntriesMutation_createEntries_errors {
  __typename: "CreateEntriesErrors";
  /**
   * The experience ID of the entry which fails to save
   */
  experienceId: string;
  /**
   * The client ID of the entry which fails to save
   */
  clientId: string;
  errors: CreateEntriesMutation_createEntries_errors_errors;
}

export interface CreateEntriesMutation_createEntries {
  __typename: "CreateEntriesResponse";
  /**
   * Experience ID of an entry we are trying to create
   */
  experienceId: string;
  /**
   * The entries that were successfully inserted for a particular
   *   experience ID
   */
  entries: (CreateEntriesMutation_createEntries_entries | null)[];
  /**
   * List of error objects denoting entries that fail to insert for
   *   a particular experience ID
   */
  errors: (CreateEntriesMutation_createEntries_errors | null)[] | null;
}

export interface CreateEntriesMutation {
  /**
   * Create several entries, for one or more experiences
   */
  createEntries: (CreateEntriesMutation_createEntries | null)[] | null;
}

export interface CreateEntriesMutationVariables {
  input: CreateEntriesInput[];
}

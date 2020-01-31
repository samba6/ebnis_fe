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
  /**
   * Client ID indicates that data object was created offline
   */
  clientId: string | null;
  insertedAt: any;
  updatedAt: any;
}

export interface CreateEntriesMutation_createEntries_entries {
  __typename: "Entry";
  /**
   * Entry ID
   */
  id: string;
  /**
   * The ID of experience to which this entry belongs.
   */
  experienceId: string;
  /**
   * The client ID which indicates that an entry has been created while server
   *   is offline and is to be saved. The client ID uniquely
   *   identifies this entry and will be used to prevent conflict while saving entry
   *   created offline and must thus be non null in this situation.
   */
  clientId: string | null;
  insertedAt: any;
  updatedAt: any;
  /**
   * Indicates whether entry has been modified offline, in which case this
   *   property will be true, otherwise it will be falsy
   */
  modOffline: boolean | null;
  /**
   * The list of data belonging to this entry.
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
  clientId: string | null;
  errors: CreateEntriesMutation_createEntries_errors_errors_dataObjectsErrors_errors;
}

export interface CreateEntriesMutation_createEntries_errors_errors {
  __typename: "CreateEntryErrors";
  /**
   * May be we failed because entry.clientId is already taken by another
   *   entry belonging to the experience.
   */
  clientId: string | null;
  /**
   * A catch-all field for when we are unable to create an entry
   */
  entry: string | null;
  /**
   * An offline entry of offline experience must have its experience ID same as
   *   experience.clientId.
   */
  experienceId: string | null;
  /**
   * Did we fail because, say, we could not fetch the experience
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

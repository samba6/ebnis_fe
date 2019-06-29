/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

import { CreateEntryInput } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: CreateEntriesMutation
// ====================================================

export interface CreateEntriesMutation_createEntries_entries_fields {
  __typename: "Field";
  defId: string;
  data: any;
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
  expId: string;
  /**
   * The client ID which indicates that an entry has been created while server
   *   is offline and is to be saved with the server, the client ID uniquely
   *   identifies this entry and will be used prevent conflict while saving entry
   *   created while server offline.
   */
  clientId: string | null;
  insertedAt: any;
  updatedAt: any;
  /**
   * The data fields belonging to this entry
   */
  fields: (CreateEntriesMutation_createEntries_entries_fields | null)[];
}

export interface CreateEntriesMutation_createEntries_errors {
  __typename: "CreateEntriesError";
  /**
   * The experience ID of the entry which fails to save
   */
  experienceId: string;
  /**
   * The client ID of the entry which fails to save
   */
  clientId: string;
  /**
   * The failure error
   */
  error: string;
}

export interface CreateEntriesMutation_createEntries {
  __typename: "CreateEntriesResponse";
  experienceId: string;
  /**
   * The entries that were successfully inserted
   */
  entries: (CreateEntriesMutation_createEntries_entries | null)[];
  /**
   * List of error objects denoting entries that fail to insert
   */
  errors: (CreateEntriesMutation_createEntries_errors | null)[] | null;
}

export interface CreateEntriesMutation {
  /**
   * Create several entries, for several experiences
   */
  createEntries: (CreateEntriesMutation_createEntries | null)[] | null;
}

export interface CreateEntriesMutationVariables {
  createEntries: CreateEntryInput[];
}

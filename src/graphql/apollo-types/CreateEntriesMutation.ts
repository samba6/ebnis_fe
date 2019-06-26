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
   * The client ID which indicates that an entry has been created offline
   *   and is to be synced with the server, the client ID uniquely identifies
   *   this entry and will be used prevent sync conflict.
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
  clientId: string;
  error: string;
}

export interface CreateEntriesMutation_createEntries {
  __typename: "CreateEntriesResponse";
  expId: string;
  entries: (CreateEntriesMutation_createEntries_entries | null)[];
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

/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL fragment: CreateEntriesResponseFragment
// ====================================================

export interface CreateEntriesResponseFragment_entries_fields {
  __typename: "Field";
  defId: string;
  data: any;
}

export interface CreateEntriesResponseFragment_entries {
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
  fields: (CreateEntriesResponseFragment_entries_fields | null)[];
}

export interface CreateEntriesResponseFragment_errors {
  __typename: "CreateEntriesError";
  clientId: string;
  error: string;
}

export interface CreateEntriesResponseFragment {
  __typename: "CreateEntriesResponse";
  expId: string;
  entries: (CreateEntriesResponseFragment_entries | null)[];
  errors: (CreateEntriesResponseFragment_errors | null)[] | null;
}

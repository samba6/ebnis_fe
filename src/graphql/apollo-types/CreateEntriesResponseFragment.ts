/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL fragment: CreateEntriesResponseFragment
// ====================================================

export interface CreateEntriesResponseFragment_successes_entries_fields {
  __typename: "Field";
  defId: string;
  data: any;
}

export interface CreateEntriesResponseFragment_successes_entries {
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
  fields: (CreateEntriesResponseFragment_successes_entries_fields | null)[];
}

export interface CreateEntriesResponseFragment_successes {
  __typename: "CreateEntriesResponseEntry";
  expId: string;
  entries: (CreateEntriesResponseFragment_successes_entries | null)[];
}

export interface CreateEntriesResponseFragment_failures {
  __typename: "CreateEntriesResponseError";
  clientId: string;
  error: string;
}

export interface CreateEntriesResponseFragment {
  __typename: "CreateEntriesResponse";
  successes: (CreateEntriesResponseFragment_successes | null)[] | null;
  failures: (CreateEntriesResponseFragment_failures | null)[] | null;
}

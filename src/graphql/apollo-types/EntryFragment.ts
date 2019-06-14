/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL fragment: EntryFragment
// ====================================================

export interface EntryFragment_fields {
  __typename: "Field";
  defId: string;
  data: any;
}

export interface EntryFragment {
  __typename: "Entry";
  /**
   * The ID of an object
   */
  id: string;
  /**
   * The ID of experience to which this entry belongs
   */
  expId: string;
  /**
   * The client ID. For experiences created on the client and to be synced
   *   with the server, the client ID uniquely identifies such and can be used
   *   to enforce uniqueness at the DB level. Not providing client_id assumes
   *   a fresh experience.
   */
  clientId: string | null;
  insertedAt: any;
  updatedAt: any;
  /**
   * The data fields belonging to this entry
   */
  fields: (EntryFragment_fields | null)[];
}

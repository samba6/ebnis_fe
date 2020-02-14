/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL fragment: CreateEntrySuccessFragment
// ====================================================

export interface CreateEntrySuccessFragment_entry_dataObjects {
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

export interface CreateEntrySuccessFragment_entry {
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
  dataObjects: (CreateEntrySuccessFragment_entry_dataObjects | null)[];
}

export interface CreateEntrySuccessFragment {
  __typename: "CreateEntrySuccess";
  entry: CreateEntrySuccessFragment_entry;
}

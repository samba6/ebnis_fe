/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

import { UpdateEntryInput } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: UpdateEntriesOnline
// ====================================================

export interface UpdateEntriesOnline_updateEntries_UpdateEntriesAllFail {
  __typename: "UpdateEntriesAllFail";
  error: string;
}

export interface UpdateEntriesOnline_updateEntries_UpdateEntriesSomeSuccess_entries_UpdateEntryErrors_errors {
  __typename: "UpdateEntryError";
  entryId: string;
  error: string;
}

export interface UpdateEntriesOnline_updateEntries_UpdateEntriesSomeSuccess_entries_UpdateEntryErrors {
  __typename: "UpdateEntryErrors";
  errors: UpdateEntriesOnline_updateEntries_UpdateEntriesSomeSuccess_entries_UpdateEntryErrors_errors | null;
}

export interface UpdateEntriesOnline_updateEntries_UpdateEntriesSomeSuccess_entries_UpdateEntrySomeSuccess_entry_dataObjects_DataObjectFullErrors_errors {
  __typename: "DataObjectFullError";
  id: string;
  definition: string | null;
  definitionId: string | null;
  clientId: string | null;
  /**
   * For generic errors unrelated to the fields of the data object e.g.
   *   not found error
   */
  error: string | null;
  /**
   * Error related to the data e.g. a string was supplied for a decimal field.
   */
  data: string | null;
}

export interface UpdateEntriesOnline_updateEntries_UpdateEntriesSomeSuccess_entries_UpdateEntrySomeSuccess_entry_dataObjects_DataObjectFullErrors {
  __typename: "DataObjectFullErrors";
  errors: UpdateEntriesOnline_updateEntries_UpdateEntriesSomeSuccess_entries_UpdateEntrySomeSuccess_entry_dataObjects_DataObjectFullErrors_errors;
}

export interface UpdateEntriesOnline_updateEntries_UpdateEntriesSomeSuccess_entries_UpdateEntrySomeSuccess_entry_dataObjects_DataObjectSuccess_dataObject {
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

export interface UpdateEntriesOnline_updateEntries_UpdateEntriesSomeSuccess_entries_UpdateEntrySomeSuccess_entry_dataObjects_DataObjectSuccess {
  __typename: "DataObjectSuccess";
  dataObject: UpdateEntriesOnline_updateEntries_UpdateEntriesSomeSuccess_entries_UpdateEntrySomeSuccess_entry_dataObjects_DataObjectSuccess_dataObject;
}

export type UpdateEntriesOnline_updateEntries_UpdateEntriesSomeSuccess_entries_UpdateEntrySomeSuccess_entry_dataObjects = UpdateEntriesOnline_updateEntries_UpdateEntriesSomeSuccess_entries_UpdateEntrySomeSuccess_entry_dataObjects_DataObjectFullErrors | UpdateEntriesOnline_updateEntries_UpdateEntriesSomeSuccess_entries_UpdateEntrySomeSuccess_entry_dataObjects_DataObjectSuccess;

export interface UpdateEntriesOnline_updateEntries_UpdateEntriesSomeSuccess_entries_UpdateEntrySomeSuccess_entry {
  __typename: "UpdateEntry";
  entryId: string;
  /**
   * If any entry data objects is updated, then the entry itself will
   *   be updated to the latest dataObject.updatedAt
   */
  updatedAt: any | null;
  dataObjects: UpdateEntriesOnline_updateEntries_UpdateEntriesSomeSuccess_entries_UpdateEntrySomeSuccess_entry_dataObjects[];
}

export interface UpdateEntriesOnline_updateEntries_UpdateEntriesSomeSuccess_entries_UpdateEntrySomeSuccess {
  __typename: "UpdateEntrySomeSuccess";
  entry: UpdateEntriesOnline_updateEntries_UpdateEntriesSomeSuccess_entries_UpdateEntrySomeSuccess_entry;
}

export type UpdateEntriesOnline_updateEntries_UpdateEntriesSomeSuccess_entries = UpdateEntriesOnline_updateEntries_UpdateEntriesSomeSuccess_entries_UpdateEntryErrors | UpdateEntriesOnline_updateEntries_UpdateEntriesSomeSuccess_entries_UpdateEntrySomeSuccess;

export interface UpdateEntriesOnline_updateEntries_UpdateEntriesSomeSuccess {
  __typename: "UpdateEntriesSomeSuccess";
  entries: UpdateEntriesOnline_updateEntries_UpdateEntriesSomeSuccess_entries[];
}

export type UpdateEntriesOnline_updateEntries = UpdateEntriesOnline_updateEntries_UpdateEntriesAllFail | UpdateEntriesOnline_updateEntries_UpdateEntriesSomeSuccess;

export interface UpdateEntriesOnline {
  /**
   * Update several entries at once
   */
  updateEntries: UpdateEntriesOnline_updateEntries | null;
}

export interface UpdateEntriesOnlineVariables {
  input: UpdateEntryInput[];
}

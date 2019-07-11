/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

import { UpdateEntryInput } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: UpdateEntryMutation
// ====================================================

export interface UpdateEntryMutation_updateEntry_entry_fields {
  __typename: "Field";
  defId: string;
  data: any;
}

export interface UpdateEntryMutation_updateEntry_entry {
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
  fields: (UpdateEntryMutation_updateEntry_entry_fields | null)[];
}

export interface UpdateEntryMutation_updateEntry_fieldsErrors_error {
  __typename: "EntryFieldError";
  data: string | null;
  defId: string | null;
}

export interface UpdateEntryMutation_updateEntry_fieldsErrors {
  __typename: "EntryFieldErrorMeta";
  defId: string;
  error: UpdateEntryMutation_updateEntry_fieldsErrors_error | null;
}

export interface UpdateEntryMutation_updateEntry {
  __typename: "EntryUpdateReturned";
  entry: UpdateEntryMutation_updateEntry_entry | null;
  fieldsErrors: (UpdateEntryMutation_updateEntry_fieldsErrors | null)[] | null;
}

export interface UpdateEntryMutation {
  updateEntry: UpdateEntryMutation_updateEntry | null;
}

export interface UpdateEntryMutationVariables {
  input: UpdateEntryInput;
}

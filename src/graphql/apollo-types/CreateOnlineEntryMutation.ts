/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

import { CreateEntryInput } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: CreateOnlineEntryMutation
// ====================================================

export interface CreateOnlineEntryMutation_createEntry_entry_dataObjects {
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

export interface CreateOnlineEntryMutation_createEntry_entry {
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
  dataObjects: (CreateOnlineEntryMutation_createEntry_entry_dataObjects | null)[];
}

export interface CreateOnlineEntryMutation_createEntry_errors_dataObjectsErrors_errors {
  __typename: "DataObjectError";
  data: string | null;
  definition: string | null;
  definitionId: string | null;
}

export interface CreateOnlineEntryMutation_createEntry_errors_dataObjectsErrors {
  __typename: "DataObjectsErrors";
  index: number;
  clientId: string | null;
  errors: CreateOnlineEntryMutation_createEntry_errors_dataObjectsErrors_errors;
}

export interface CreateOnlineEntryMutation_createEntry_errors {
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
   * Did we fail because, say, we could not fetch the experience
   */
  experience: string | null;
  /**
   * An offline entry of offline experience must have its experience ID same as
   *   experience.clientId.
   */
  experienceId: string | null;
  /**
   * Did we fail because there are errors in the data object object?
   */
  dataObjectsErrors: (CreateOnlineEntryMutation_createEntry_errors_dataObjectsErrors | null)[] | null;
}

export interface CreateOnlineEntryMutation_createEntry {
  __typename: "CreateEntryResponse";
  entry: CreateOnlineEntryMutation_createEntry_entry | null;
  errors: CreateOnlineEntryMutation_createEntry_errors | null;
}

export interface CreateOnlineEntryMutation {
  /**
   * Create an experience entry
   */
  createEntry: CreateOnlineEntryMutation_createEntry | null;
}

export interface CreateOnlineEntryMutationVariables {
  input: CreateEntryInput;
}

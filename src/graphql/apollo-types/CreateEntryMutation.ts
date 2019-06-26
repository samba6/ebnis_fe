/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

import { CreateEntryInput } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: CreateEntryMutation
// ====================================================

export interface CreateEntryMutation_createEntry_fields {
  __typename: "Field";
  defId: string;
  data: any;
}

export interface CreateEntryMutation_createEntry {
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
  fields: (CreateEntryMutation_createEntry_fields | null)[];
}

export interface CreateEntryMutation {
  /**
   * Create an experience
   * 
   *   The error returned will be of the form:
   *   {
   *     expId?: "does not exist",
   *     fields?: [
   *       {
   *         meta: {
   *           defId: defId,
   *           index: fieldIndex
   *         },
   *         errors: {
   *           defId: "does not exist" | "has already been taken"
   *         }
   *       }
   *     ]
   *   }
   */
  createEntry: CreateEntryMutation_createEntry | null;
}

export interface CreateEntryMutationVariables {
  input: CreateEntryInput;
}

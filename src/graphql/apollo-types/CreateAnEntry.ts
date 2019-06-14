/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

import { CreateEntry } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: CreateAnEntry
// ====================================================

export interface CreateAnEntry_entry_fields {
  __typename: "Field";
  defId: string;
  data: any;
}

export interface CreateAnEntry_entry {
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
  fields: (CreateAnEntry_entry_fields | null)[];
}

export interface CreateAnEntry {
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
  entry: CreateAnEntry_entry | null;
}

export interface CreateAnEntryVariables {
  entry: CreateEntry;
}

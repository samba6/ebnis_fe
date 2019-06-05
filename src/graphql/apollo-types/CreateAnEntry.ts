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
   * Internal ID of the entry. Field `id` is the global opaque ID
   */
  _id: string;
  /**
   * The ID of an object
   */
  id: string;
  /**
   * The ID of experience to which this entry belongs
   */
  expId: string;
  /**
   * The data fields belonging to this entry
   */
  fields: (CreateAnEntry_entry_fields | null)[];
  insertedAt: any;
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

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
  id: string;
  expId: string;
  fields: (CreateAnEntry_entry_fields | null)[];
  insertedAt: any;
}

export interface CreateAnEntry {
  entry: CreateAnEntry_entry | null;
}

export interface CreateAnEntryVariables {
  entry: CreateEntry;
}

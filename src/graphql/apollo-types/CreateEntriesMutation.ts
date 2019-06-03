/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

import { CreateEntriesInput } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: CreateEntriesMutation
// ====================================================

export interface CreateEntriesMutation_createEntries_successes_entry_fields {
  __typename: "Field";
  defId: string;
  data: any;
}

export interface CreateEntriesMutation_createEntries_successes_entry {
  __typename: "Entry";
  id: string;
  expId: string;
  fields: (CreateEntriesMutation_createEntries_successes_entry_fields | null)[];
  insertedAt: any;
}

export interface CreateEntriesMutation_createEntries_successes {
  __typename: "CreateEntriesResponseEntry";
  index: number;
  entry: CreateEntriesMutation_createEntries_successes_entry;
}

export interface CreateEntriesMutation_createEntries_failures {
  __typename: "CreateEntriesResponseError";
  index: number;
  error: string;
}

export interface CreateEntriesMutation_createEntries {
  __typename: "CreateEntriesResponse";
  successes: (CreateEntriesMutation_createEntries_successes | null)[] | null;
  failures: (CreateEntriesMutation_createEntries_failures | null)[] | null;
}

export interface CreateEntriesMutation {
  createEntries: CreateEntriesMutation_createEntries | null;
}

export interface CreateEntriesMutationVariables {
  createEntries: CreateEntriesInput;
}

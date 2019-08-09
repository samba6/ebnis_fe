/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

import { CreateEntryInput } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: CreateEntryMutation
// ====================================================

export interface CreateEntryMutation_createEntry_entry_dataObjects {
  __typename: "DataObject";
  id: string;
  data: any;
  definitionId: string;
}

export interface CreateEntryMutation_createEntry_entry {
  __typename: "Entry";
  /**
   * The ID of an object
   */
  id: string;
  /**
   * The ID of experience to which this entry belongs.
   */
  experienceId: string;
  /**
   * The client ID which indicates that an entry has been created while server
   *   is offline and is to be saved. The client ID uniquely
   *   identifies this entry and will be used prevent conflict while saving entry
   *   created offline and must thus be non null in this situation.
   */
  clientId: string | null;
  insertedAt: any;
  updatedAt: any;
  /**
   * The list of data belonging to this entry
   */
  dataObjects: (CreateEntryMutation_createEntry_entry_dataObjects | null)[];
}

export interface CreateEntryMutation_createEntry_errors_dataObjectsErrors_errors {
  __typename: "DataObjectError";
  data: string | null;
  definition: string | null;
  definitionId: string | null;
}

export interface CreateEntryMutation_createEntry_errors_dataObjectsErrors {
  __typename: "DataObjectsErrors";
  index: number;
  errors: CreateEntryMutation_createEntry_errors_dataObjectsErrors_errors;
}

export interface CreateEntryMutation_createEntry_errors {
  __typename: "CreateEntryErrors";
  /**
   * May be because client ID is not unique for experience
   */
  clientId: string | null;
  /**
   * A catch-all field for when we are unable to create an entry
   */
  entry: string | null;
  /**
   * Did we fail because, say, we did could not fetch the experience
   */
  experience: string | null;
  /**
   * While saving an offline entry, its experience ID must be same as
   *   experience.clientId if saving entry via offline experience
   */
  experienceId: string | null;
  /**
   * Did we fail because there are errors in the data object object?
   */
  dataObjectsErrors: (CreateEntryMutation_createEntry_errors_dataObjectsErrors | null)[] | null;
}

export interface CreateEntryMutation_createEntry {
  __typename: "CreateEntryResponse";
  entry: CreateEntryMutation_createEntry_entry | null;
  errors: CreateEntryMutation_createEntry_errors | null;
}

export interface CreateEntryMutation {
  /**
   * Create an experience entry
   */
  createEntry: CreateEntryMutation_createEntry | null;
}

export interface CreateEntryMutationVariables {
  input: CreateEntryInput;
}

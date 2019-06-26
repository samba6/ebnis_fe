/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

import { CreateExperienceInput, CreateEntryInput, FieldType } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: UploadAllUnsavedsMutation
// ====================================================

export interface UploadAllUnsavedsMutation_saveOfflineExperiences_experience_fieldDefs {
  __typename: "FieldDef";
  id: string;
  /**
   * Name of field e.g start, end, meal
   */
  name: string;
  /**
   * The data type of the field
   */
  type: FieldType;
  /**
   * String that uniquely identifies this field definition has been
   *   created offline. If an associated entry is also created
   *   offline, then `createField.defId` **MUST BE** the same as this
   *   field and will be validated as such.
   */
  clientId: string | null;
}

export interface UploadAllUnsavedsMutation_saveOfflineExperiences_experience_entries_pageInfo {
  __typename: "PageInfo";
  /**
   * When paginating forwards, are there more items?
   */
  hasNextPage: boolean;
  /**
   * When paginating backwards, are there more items?
   */
  hasPreviousPage: boolean;
}

export interface UploadAllUnsavedsMutation_saveOfflineExperiences_experience_entries_edges_node_fields {
  __typename: "Field";
  defId: string;
  data: any;
}

export interface UploadAllUnsavedsMutation_saveOfflineExperiences_experience_entries_edges_node {
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
  fields: (UploadAllUnsavedsMutation_saveOfflineExperiences_experience_entries_edges_node_fields | null)[];
}

export interface UploadAllUnsavedsMutation_saveOfflineExperiences_experience_entries_edges {
  __typename: "EntryEdge";
  /**
   * A cursor for use in pagination
   */
  cursor: string;
  /**
   * The item at the end of the edge
   */
  node: UploadAllUnsavedsMutation_saveOfflineExperiences_experience_entries_edges_node | null;
}

export interface UploadAllUnsavedsMutation_saveOfflineExperiences_experience_entries {
  __typename: "EntryConnection";
  pageInfo: UploadAllUnsavedsMutation_saveOfflineExperiences_experience_entries_pageInfo;
  edges: (UploadAllUnsavedsMutation_saveOfflineExperiences_experience_entries_edges | null)[] | null;
}

export interface UploadAllUnsavedsMutation_saveOfflineExperiences_experience {
  __typename: "Experience";
  /**
   * The ID of an object
   */
  id: string;
  /**
   * The title of the experience
   */
  title: string;
  /**
   * The description of the experience
   */
  description: string | null;
  /**
   * The client ID. For experiences created on the client while server is
   *   offline and to be saved , the client ID uniquely identifies such and can
   *   be used to enforce uniqueness at the DB level. Not providing client_id
   *   assumes a fresh experience.
   */
  clientId: string | null;
  insertedAt: any;
  updatedAt: any;
  /**
   * The field definitions used for the experience entries
   */
  fieldDefs: (UploadAllUnsavedsMutation_saveOfflineExperiences_experience_fieldDefs | null)[];
  /**
   * The entries of the experience - can be paginated
   */
  entries: UploadAllUnsavedsMutation_saveOfflineExperiences_experience_entries;
}

export interface UploadAllUnsavedsMutation_saveOfflineExperiences_experienceError {
  __typename: "OfflineExperienceExperienceError";
  /**
   * The index of the failing experience in the list of experiences input
   */
  index: number;
  /**
   * The client ID of the failing experience. As user may not have provided a
   *   client ID, this field is nullable and in that case, the index field will
   *   be used to identify this error
   */
  clientId: string | null;
  error: string;
}

export interface UploadAllUnsavedsMutation_saveOfflineExperiences_entriesErrors {
  __typename: "OfflineExperienceEntryError";
  experienceId: string;
  clientId: string;
  error: string;
}

export interface UploadAllUnsavedsMutation_saveOfflineExperiences {
  __typename: "OfflineExperience";
  experience: UploadAllUnsavedsMutation_saveOfflineExperiences_experience | null;
  experienceError: UploadAllUnsavedsMutation_saveOfflineExperiences_experienceError | null;
  entriesErrors: (UploadAllUnsavedsMutation_saveOfflineExperiences_entriesErrors | null)[] | null;
}

export interface UploadAllUnsavedsMutation_createEntries_entries_fields {
  __typename: "Field";
  defId: string;
  data: any;
}

export interface UploadAllUnsavedsMutation_createEntries_entries {
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
  fields: (UploadAllUnsavedsMutation_createEntries_entries_fields | null)[];
}

export interface UploadAllUnsavedsMutation_createEntries_errors {
  __typename: "CreateEntriesError";
  clientId: string;
  error: string;
}

export interface UploadAllUnsavedsMutation_createEntries {
  __typename: "CreateEntriesResponse";
  expId: string;
  entries: (UploadAllUnsavedsMutation_createEntries_entries | null)[];
  errors: (UploadAllUnsavedsMutation_createEntries_errors | null)[] | null;
}

export interface UploadAllUnsavedsMutation {
  /**
   * Save many experiences created offline
   */
  saveOfflineExperiences: (UploadAllUnsavedsMutation_saveOfflineExperiences | null)[] | null;
  /**
   * Create several entries, for several experiences
   */
  createEntries: (UploadAllUnsavedsMutation_createEntries | null)[] | null;
}

export interface UploadAllUnsavedsMutationVariables {
  unsavedExperiences: CreateExperienceInput[];
  unsavedEntries: CreateEntryInput[];
}

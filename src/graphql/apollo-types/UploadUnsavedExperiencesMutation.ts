/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

import { CreateExperienceInput, FieldType } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: UploadUnsavedExperiencesMutation
// ====================================================

export interface UploadUnsavedExperiencesMutation_saveOfflineExperiences_experience_fieldDefs {
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

export interface UploadUnsavedExperiencesMutation_saveOfflineExperiences_experience_entries_pageInfo {
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

export interface UploadUnsavedExperiencesMutation_saveOfflineExperiences_experience_entries_edges_node_fields {
  __typename: "Field";
  defId: string;
  data: any;
}

export interface UploadUnsavedExperiencesMutation_saveOfflineExperiences_experience_entries_edges_node {
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
  fields: (UploadUnsavedExperiencesMutation_saveOfflineExperiences_experience_entries_edges_node_fields | null)[];
}

export interface UploadUnsavedExperiencesMutation_saveOfflineExperiences_experience_entries_edges {
  __typename: "EntryEdge";
  /**
   * A cursor for use in pagination
   */
  cursor: string;
  /**
   * The item at the end of the edge
   */
  node: UploadUnsavedExperiencesMutation_saveOfflineExperiences_experience_entries_edges_node | null;
}

export interface UploadUnsavedExperiencesMutation_saveOfflineExperiences_experience_entries {
  __typename: "EntryConnection";
  pageInfo: UploadUnsavedExperiencesMutation_saveOfflineExperiences_experience_entries_pageInfo;
  edges: (UploadUnsavedExperiencesMutation_saveOfflineExperiences_experience_entries_edges | null)[] | null;
}

export interface UploadUnsavedExperiencesMutation_saveOfflineExperiences_experience {
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
  fieldDefs: (UploadUnsavedExperiencesMutation_saveOfflineExperiences_experience_fieldDefs | null)[];
  /**
   * The entries of the experience - can be paginated
   */
  entries: UploadUnsavedExperiencesMutation_saveOfflineExperiences_experience_entries;
}

export interface UploadUnsavedExperiencesMutation_saveOfflineExperiences_experienceError {
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

export interface UploadUnsavedExperiencesMutation_saveOfflineExperiences_entriesErrors {
  __typename: "OfflineExperienceEntryError";
  experienceId: string;
  clientId: string;
  error: string;
}

export interface UploadUnsavedExperiencesMutation_saveOfflineExperiences {
  __typename: "OfflineExperience";
  experience: UploadUnsavedExperiencesMutation_saveOfflineExperiences_experience | null;
  experienceError: UploadUnsavedExperiencesMutation_saveOfflineExperiences_experienceError | null;
  entriesErrors: (UploadUnsavedExperiencesMutation_saveOfflineExperiences_entriesErrors | null)[] | null;
}

export interface UploadUnsavedExperiencesMutation {
  /**
   * Save many experiences created offline
   */
  saveOfflineExperiences: (UploadUnsavedExperiencesMutation_saveOfflineExperiences | null)[] | null;
}

export interface UploadUnsavedExperiencesMutationVariables {
  input: CreateExperienceInput[];
}

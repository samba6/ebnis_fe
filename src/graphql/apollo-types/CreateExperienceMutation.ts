/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

import { CreateExperienceInput, PaginationInput, FieldType } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: CreateExperienceMutation
// ====================================================

export interface CreateExperienceMutation_createExperience_fieldDefs {
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

export interface CreateExperienceMutation_createExperience_entries_pageInfo {
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

export interface CreateExperienceMutation_createExperience_entries_edges_node_fields {
  __typename: "Field";
  defId: string;
  data: any;
}

export interface CreateExperienceMutation_createExperience_entries_edges_node {
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
  fields: (CreateExperienceMutation_createExperience_entries_edges_node_fields | null)[];
}

export interface CreateExperienceMutation_createExperience_entries_edges {
  __typename: "EntryEdge";
  /**
   * A cursor for use in pagination
   */
  cursor: string;
  /**
   * The item at the end of the edge
   */
  node: CreateExperienceMutation_createExperience_entries_edges_node | null;
}

export interface CreateExperienceMutation_createExperience_entries {
  __typename: "EntryConnection";
  pageInfo: CreateExperienceMutation_createExperience_entries_pageInfo;
  edges: (CreateExperienceMutation_createExperience_entries_edges | null)[] | null;
}

export interface CreateExperienceMutation_createExperience {
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
   * The client ID. For experiences created on the client and to be synced
   *   with the server, the client ID uniquely identifies such and can be used
   *   to enforce uniqueness at the DB level. Not providing client_id assumes
   *   a fresh experience.
   */
  clientId: string | null;
  insertedAt: any;
  updatedAt: any;
  /**
   * The field definitions used for the experience entries
   */
  fieldDefs: (CreateExperienceMutation_createExperience_fieldDefs | null)[];
  /**
   * The entries of the experience - can be paginated
   */
  entries: CreateExperienceMutation_createExperience_entries;
}

export interface CreateExperienceMutation {
  /**
   * Create an experience
   */
  createExperience: CreateExperienceMutation_createExperience | null;
}

export interface CreateExperienceMutationVariables {
  createExperienceInput: CreateExperienceInput;
  entriesPagination?: PaginationInput | null;
}

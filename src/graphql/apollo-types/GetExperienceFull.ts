/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

import { PaginationInput, FieldType } from "./globalTypes";

// ====================================================
// GraphQL query operation: GetExperienceFull
// ====================================================

export interface GetExperienceFull_getExperience_fieldDefs {
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

export interface GetExperienceFull_getExperience_entries_pageInfo {
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

export interface GetExperienceFull_getExperience_entries_edges_node_fields {
  __typename: "Field";
  defId: string;
  data: any;
}

export interface GetExperienceFull_getExperience_entries_edges_node {
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
  fields: (GetExperienceFull_getExperience_entries_edges_node_fields | null)[];
}

export interface GetExperienceFull_getExperience_entries_edges {
  __typename: "EntryEdge";
  /**
   * A cursor for use in pagination
   */
  cursor: string;
  /**
   * The item at the end of the edge
   */
  node: GetExperienceFull_getExperience_entries_edges_node | null;
}

export interface GetExperienceFull_getExperience_entries {
  __typename: "EntryConnection";
  pageInfo: GetExperienceFull_getExperience_entries_pageInfo;
  edges: (GetExperienceFull_getExperience_entries_edges | null)[] | null;
}

export interface GetExperienceFull_getExperience {
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
  hasUnsaved: boolean | null;
  /**
   * The field definitions used for the experience entries
   */
  fieldDefs: (GetExperienceFull_getExperience_fieldDefs | null)[];
  /**
   * The entries of the experience - can be paginated
   */
  entries: GetExperienceFull_getExperience_entries;
}

export interface GetExperienceFull {
  /**
   * get an experience
   */
  getExperience: GetExperienceFull_getExperience | null;
}

export interface GetExperienceFullVariables {
  id: string;
  entriesPagination?: PaginationInput | null;
}

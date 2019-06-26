/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

import { GetExperiencesInput, PaginationInput, FieldType } from "./globalTypes";

// ====================================================
// GraphQL query operation: PreFetchExperiences
// ====================================================

export interface PreFetchExperiences_getExperiences_edges_node_fieldDefs {
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

export interface PreFetchExperiences_getExperiences_edges_node_entries_pageInfo {
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

export interface PreFetchExperiences_getExperiences_edges_node_entries_edges_node_fields {
  __typename: "Field";
  defId: string;
  data: any;
}

export interface PreFetchExperiences_getExperiences_edges_node_entries_edges_node {
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
  fields: (PreFetchExperiences_getExperiences_edges_node_entries_edges_node_fields | null)[];
}

export interface PreFetchExperiences_getExperiences_edges_node_entries_edges {
  __typename: "EntryEdge";
  /**
   * A cursor for use in pagination
   */
  cursor: string;
  /**
   * The item at the end of the edge
   */
  node: PreFetchExperiences_getExperiences_edges_node_entries_edges_node | null;
}

export interface PreFetchExperiences_getExperiences_edges_node_entries {
  __typename: "EntryConnection";
  pageInfo: PreFetchExperiences_getExperiences_edges_node_entries_pageInfo;
  edges: (PreFetchExperiences_getExperiences_edges_node_entries_edges | null)[] | null;
}

export interface PreFetchExperiences_getExperiences_edges_node {
  __typename: "Experience";
  /**
   * The ID of an object
   */
  id: string;
  /**
   * The field definitions used for the experience entries
   */
  fieldDefs: (PreFetchExperiences_getExperiences_edges_node_fieldDefs | null)[];
  /**
   * The entries of the experience - can be paginated
   */
  entries: PreFetchExperiences_getExperiences_edges_node_entries;
}

export interface PreFetchExperiences_getExperiences_edges {
  __typename: "ExperienceEdge";
  /**
   * A cursor for use in pagination
   */
  cursor: string;
  /**
   * The item at the end of the edge
   */
  node: PreFetchExperiences_getExperiences_edges_node | null;
}

export interface PreFetchExperiences_getExperiences {
  __typename: "ExperienceConnection";
  edges: (PreFetchExperiences_getExperiences_edges | null)[] | null;
}

export interface PreFetchExperiences {
  /**
   * Get all experiences belonging to a user. The experiences returned may be
   *   paginated
   */
  getExperiences: PreFetchExperiences_getExperiences | null;
}

export interface PreFetchExperiencesVariables {
  experiencesArgs?: GetExperiencesInput | null;
  entriesPagination?: PaginationInput | null;
}

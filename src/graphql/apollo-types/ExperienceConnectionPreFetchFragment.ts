/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

import { FieldType } from "./globalTypes";

// ====================================================
// GraphQL fragment: ExperienceConnectionPreFetchFragment
// ====================================================

export interface ExperienceConnectionPreFetchFragment_edges_node_dataDefinitions {
  __typename: "DataDefinition";
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
   * String that uniquely identifies this data definition has been
   *   created offline. If an associated entry is also created
   *   offline, then `dataDefinition.definitionId` **MUST BE** the same as this
   *   field and will be validated as such.
   */
  clientId: string | null;
}

export interface ExperienceConnectionPreFetchFragment_edges_node_entries_pageInfo {
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

export interface ExperienceConnectionPreFetchFragment_edges_node_entries_edges_node_dataObjects {
  __typename: "DataObject";
  id: string;
  data: any;
  definitionId: string;
  /**
   * Client ID indicates that data object was created offline
   */
  clientId: string | null;
  insertedAt: any;
  updatedAt: any;
}

export interface ExperienceConnectionPreFetchFragment_edges_node_entries_edges_node {
  __typename: "Entry";
  /**
   * Entry ID
   */
  id: string;
  /**
   * The ID of experience to which this entry belongs.
   */
  experienceId: string;
  /**
   * The client ID which indicates that an entry has been created while server
   *   is offline and is to be saved. The client ID uniquely
   *   identifies this entry and will be used to prevent conflict while saving entry
   *   created offline and must thus be non null in this situation.
   */
  clientId: string | null;
  insertedAt: any;
  updatedAt: any;
  /**
   * The list of data belonging to this entry.
   */
  dataObjects: (ExperienceConnectionPreFetchFragment_edges_node_entries_edges_node_dataObjects | null)[];
}

export interface ExperienceConnectionPreFetchFragment_edges_node_entries_edges {
  __typename: "EntryEdge";
  /**
   * A cursor for use in pagination
   */
  cursor: string;
  /**
   * The item at the end of the edge
   */
  node: ExperienceConnectionPreFetchFragment_edges_node_entries_edges_node | null;
}

export interface ExperienceConnectionPreFetchFragment_edges_node_entries {
  __typename: "EntryConnection";
  pageInfo: ExperienceConnectionPreFetchFragment_edges_node_entries_pageInfo;
  edges: (ExperienceConnectionPreFetchFragment_edges_node_entries_edges | null)[] | null;
}

export interface ExperienceConnectionPreFetchFragment_edges_node {
  __typename: "Experience";
  /**
   * The title of the experience
   */
  id: string;
  /**
   * The field definitions used for the experience entries
   */
  dataDefinitions: (ExperienceConnectionPreFetchFragment_edges_node_dataDefinitions | null)[];
  /**
   * The entries of the experience - can be paginated
   */
  entries: ExperienceConnectionPreFetchFragment_edges_node_entries;
}

export interface ExperienceConnectionPreFetchFragment_edges {
  __typename: "ExperienceEdge";
  /**
   * A cursor for use in pagination
   */
  cursor: string;
  /**
   * The item at the end of the edge
   */
  node: ExperienceConnectionPreFetchFragment_edges_node | null;
}

export interface ExperienceConnectionPreFetchFragment {
  __typename: "ExperienceConnection";
  edges: (ExperienceConnectionPreFetchFragment_edges | null)[] | null;
}

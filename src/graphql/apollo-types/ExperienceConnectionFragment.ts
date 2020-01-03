/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

import { DataTypes } from "./globalTypes";

// ====================================================
// GraphQL fragment: ExperienceConnectionFragment
// ====================================================

export interface ExperienceConnectionFragment_pageInfo {
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

export interface ExperienceConnectionFragment_edges_node_dataDefinitions {
  __typename: "DataDefinition";
  id: string;
  /**
   * Name of field e.g start, end, meal
   */
  name: string;
  /**
   * The data type
   */
  type: DataTypes;
  /**
   * String that uniquely identifies this data definition has been
   *   created offline. If an associated entry is also created
   *   offline, then `dataDefinition.definitionId` **MUST BE** the same as this
   *   field and will be validated as such.
   */
  clientId: string | null;
}

export interface ExperienceConnectionFragment_edges_node_entries_pageInfo {
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

export interface ExperienceConnectionFragment_edges_node_entries_edges_node_dataObjects {
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

export interface ExperienceConnectionFragment_edges_node_entries_edges_node {
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
   * Indicates whether entry has been modified offline, in which case this
   *   property will be true, otherwise it will be falsy
   */
  modOffline: boolean | null;
  /**
   * The list of data belonging to this entry.
   */
  dataObjects: (ExperienceConnectionFragment_edges_node_entries_edges_node_dataObjects | null)[];
}

export interface ExperienceConnectionFragment_edges_node_entries_edges {
  __typename: "EntryEdge";
  /**
   * A cursor for use in pagination
   */
  cursor: string;
  /**
   * The item at the end of the edge
   */
  node: ExperienceConnectionFragment_edges_node_entries_edges_node | null;
}

export interface ExperienceConnectionFragment_edges_node_entries {
  __typename: "EntryConnection";
  pageInfo: ExperienceConnectionFragment_edges_node_entries_pageInfo;
  edges: (ExperienceConnectionFragment_edges_node_entries_edges | null)[] | null;
}

export interface ExperienceConnectionFragment_edges_node {
  __typename: "Experience";
  /**
   * The title of the experience
   */
  id: string;
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
  dataDefinitions: (ExperienceConnectionFragment_edges_node_dataDefinitions | null)[];
  /**
   * The entries of the experience - can be paginated
   */
  entries: ExperienceConnectionFragment_edges_node_entries;
}

export interface ExperienceConnectionFragment_edges {
  __typename: "ExperienceEdge";
  /**
   * A cursor for use in pagination
   */
  cursor: string;
  /**
   * The item at the end of the edge
   */
  node: ExperienceConnectionFragment_edges_node | null;
}

export interface ExperienceConnectionFragment {
  __typename: "ExperienceConnection";
  pageInfo: ExperienceConnectionFragment_pageInfo;
  edges: (ExperienceConnectionFragment_edges | null)[] | null;
}

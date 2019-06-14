/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

import { FieldType } from "./globalTypes";

// ====================================================
// GraphQL fragment: ExperienceAllFieldsFragment
// ====================================================

export interface ExperienceAllFieldsFragment_fieldDefs {
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
}

export interface ExperienceAllFieldsFragment_entries_pageInfo {
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

export interface ExperienceAllFieldsFragment_entries_edges_node_fields {
  __typename: "Field";
  defId: string;
  data: any;
}

export interface ExperienceAllFieldsFragment_entries_edges_node {
  __typename: "Entry";
  /**
   * The ID of an object
   */
  id: string;
  /**
   * The ID of experience to which this entry belongs
   */
  expId: string;
  /**
   * The client ID. For experiences created on the client and to be synced
   *   with the server, the client ID uniquely identifies such and can be used
   *   to enforce uniqueness at the DB level. Not providing client_id assumes
   *   a fresh experience.
   */
  clientId: string | null;
  /**
   * The data fields belonging to this entry
   */
  fields: (ExperienceAllFieldsFragment_entries_edges_node_fields | null)[];
  insertedAt: any;
}

export interface ExperienceAllFieldsFragment_entries_edges {
  __typename: "EntryEdge";
  /**
   * A cursor for use in pagination
   */
  cursor: string;
  /**
   * The item at the end of the edge
   */
  node: ExperienceAllFieldsFragment_entries_edges_node | null;
}

export interface ExperienceAllFieldsFragment_entries {
  __typename: "EntryConnection";
  pageInfo: ExperienceAllFieldsFragment_entries_pageInfo;
  edges: (ExperienceAllFieldsFragment_entries_edges | null)[] | null;
}

export interface ExperienceAllFieldsFragment {
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
  /**
   * The field definitions used for the experience entries
   */
  fieldDefs: (ExperienceAllFieldsFragment_fieldDefs | null)[];
  /**
   * The entries of the experience - can be paginated
   */
  entries: ExperienceAllFieldsFragment_entries;
}

/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

import { FieldType } from "./globalTypes";

// ====================================================
// GraphQL fragment: ExperienceRestFragment
// ====================================================

export interface ExperienceRestFragment_fieldDefs {
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

export interface ExperienceRestFragment_entries_pageInfo {
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

export interface ExperienceRestFragment_entries_edges_node_fields {
  __typename: "Field";
  defId: string;
  data: any;
}

export interface ExperienceRestFragment_entries_edges_node {
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
  fields: (ExperienceRestFragment_entries_edges_node_fields | null)[];
}

export interface ExperienceRestFragment_entries_edges {
  __typename: "EntryEdge";
  /**
   * A cursor for use in pagination
   */
  cursor: string;
  /**
   * The item at the end of the edge
   */
  node: ExperienceRestFragment_entries_edges_node | null;
}

export interface ExperienceRestFragment_entries {
  __typename: "EntryConnection";
  pageInfo: ExperienceRestFragment_entries_pageInfo;
  edges: (ExperienceRestFragment_entries_edges | null)[] | null;
}

export interface ExperienceRestFragment {
  __typename: "Experience";
  /**
   * The ID of an object
   */
  id: string;
  /**
   * The field definitions used for the experience entries
   */
  fieldDefs: (ExperienceRestFragment_fieldDefs | null)[];
  /**
   * The entries of the experience - can be paginated
   */
  entries: ExperienceRestFragment_entries;
}

/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

import { CreateExp, FieldType } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: CreateExpMutation
// ====================================================

export interface CreateExpMutation_exp_fieldDefs {
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

export interface CreateExpMutation_exp_entries_pageInfo {
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

export interface CreateExpMutation_exp_entries_edges_node_fields {
  __typename: "Field";
  defId: string;
  data: any;
}

export interface CreateExpMutation_exp_entries_edges_node {
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
  fields: (CreateExpMutation_exp_entries_edges_node_fields | null)[];
  insertedAt: any;
}

export interface CreateExpMutation_exp_entries_edges {
  __typename: "EntryEdge";
  /**
   * A cursor for use in pagination
   */
  cursor: string;
  /**
   * The item at the end of the edge
   */
  node: CreateExpMutation_exp_entries_edges_node | null;
}

export interface CreateExpMutation_exp_entries {
  __typename: "EntryConnection";
  pageInfo: CreateExpMutation_exp_entries_pageInfo;
  edges: (CreateExpMutation_exp_entries_edges | null)[] | null;
}

export interface CreateExpMutation_exp {
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
  fieldDefs: (CreateExpMutation_exp_fieldDefs | null)[];
  /**
   * The entries of the experience - can be paginated
   */
  entries: CreateExpMutation_exp_entries;
}

export interface CreateExpMutation {
  exp: CreateExpMutation_exp | null;
}

export interface CreateExpMutationVariables {
  exp: CreateExp;
}

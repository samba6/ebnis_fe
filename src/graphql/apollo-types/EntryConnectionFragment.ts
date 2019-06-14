/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL fragment: EntryConnectionFragment
// ====================================================

export interface EntryConnectionFragment_pageInfo {
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

export interface EntryConnectionFragment_edges_node_fields {
  __typename: "Field";
  defId: string;
  data: any;
}

export interface EntryConnectionFragment_edges_node {
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
  fields: (EntryConnectionFragment_edges_node_fields | null)[];
  insertedAt: any;
}

export interface EntryConnectionFragment_edges {
  __typename: "EntryEdge";
  /**
   * A cursor for use in pagination
   */
  cursor: string;
  /**
   * The item at the end of the edge
   */
  node: EntryConnectionFragment_edges_node | null;
}

export interface EntryConnectionFragment {
  __typename: "EntryConnection";
  pageInfo: EntryConnectionFragment_pageInfo;
  edges: (EntryConnectionFragment_edges | null)[] | null;
}

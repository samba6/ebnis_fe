/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

import { PaginationInput } from "./globalTypes";

// ====================================================
// GraphQL query operation: GetExps
// ====================================================

export interface GetExps_exps_pageInfo {
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

export interface GetExps_exps_edges_node {
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
}

export interface GetExps_exps_edges {
  __typename: "ExperienceEdge";
  /**
   * A cursor for use in pagination
   */
  cursor: string;
  /**
   * The item at the end of the edge
   */
  node: GetExps_exps_edges_node | null;
}

export interface GetExps_exps {
  __typename: "ExperienceConnection";
  pageInfo: GetExps_exps_pageInfo;
  edges: (GetExps_exps_edges | null)[] | null;
}

export interface GetExps {
  /**
   * Get all experiences belonging to a user
   */
  exps: GetExps_exps | null;
}

export interface GetExpsVariables {
  pagination: PaginationInput;
}

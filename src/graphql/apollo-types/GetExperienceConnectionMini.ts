/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

import { GetExperiencesInput } from "./globalTypes";

// ====================================================
// GraphQL query operation: GetExperienceConnectionMini
// ====================================================

export interface GetExperienceConnectionMini_getExperiences_pageInfo {
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

export interface GetExperienceConnectionMini_getExperiences_edges_node {
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
}

export interface GetExperienceConnectionMini_getExperiences_edges {
  __typename: "ExperienceEdge";
  /**
   * A cursor for use in pagination
   */
  cursor: string;
  /**
   * The item at the end of the edge
   */
  node: GetExperienceConnectionMini_getExperiences_edges_node | null;
}

export interface GetExperienceConnectionMini_getExperiences {
  __typename: "ExperienceConnection";
  pageInfo: GetExperienceConnectionMini_getExperiences_pageInfo;
  edges: (GetExperienceConnectionMini_getExperiences_edges | null)[] | null;
}

export interface GetExperienceConnectionMini {
  /**
   * Get all experiences belonging to a user.
   *   The experiences returned may be paginated
   *   and may be filtered by IDs
   */
  getExperiences: GetExperienceConnectionMini_getExperiences | null;
}

export interface GetExperienceConnectionMiniVariables {
  input?: GetExperiencesInput | null;
}

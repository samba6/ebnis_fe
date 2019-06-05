/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

import { ListExperiencesEntriesInput } from "./globalTypes";

// ====================================================
// GraphQL query operation: ListExperiencesEntries
// ====================================================

export interface ListExperiencesEntries_listExperiencesEntries_pageInfo {
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

export interface ListExperiencesEntries_listExperiencesEntries_edges_node_fields {
  __typename: "Field";
  defId: string;
  data: any;
}

export interface ListExperiencesEntries_listExperiencesEntries_edges_node {
  __typename: "EntryRelay";
  /**
   * Internal ID of the entry. Field `id` is the global opaque ID
   */
  _id: string;
  /**
   * The ID of an object
   */
  id: string;
  /**
   * The ID of experience to which this entry belongs
   */
  expId: string;
  /**
   * The data fields belonging to this entry
   */
  fields: (ListExperiencesEntries_listExperiencesEntries_edges_node_fields | null)[];
  insertedAt: any;
}

export interface ListExperiencesEntries_listExperiencesEntries_edges {
  __typename: "EntryRelayEdge";
  /**
   * A cursor for use in pagination
   */
  cursor: string;
  /**
   * The item at the end of the edge
   */
  node: ListExperiencesEntries_listExperiencesEntries_edges_node | null;
}

export interface ListExperiencesEntries_listExperiencesEntries {
  __typename: "EntryRelayConnection";
  pageInfo: ListExperiencesEntries_listExperiencesEntries_pageInfo;
  edges: (ListExperiencesEntries_listExperiencesEntries_edges | null)[] | null;
}

export interface ListExperiencesEntries {
  /**
   * Get entries for many experiences simultaneously. Use like so:
   * 
   *   query ListExperiencesEntries($input: ListExperiencesEntriesInput!) {
   *     listExperiencesEntries(input: $input) {
   *       pageInfo {
   *         hasNextPage
   *         hasPreviousPage
   *       }
   * 
   *       edges {
   *         cursor
   *         node {
   *           ...EntryRelayFragment
   *         }
   *       }
   *     }
   *   }
   * 
   *   You get:
   *   ```typescript
   *   {
   *     listExperiencesEntries: [
   *       {
   *         edges: [
   *           {
   *             cursor: string;
   *             node: {
   *               id: string;
   *               _id: string;
   *             }
   *           }
   *         ],
   * 
   *         pageInfo: {
   *           hasNextPage: boolean;
   *           hasPreviousPage: boolean;
   *         }
   *       }
   *     ]
   *   }
   *   ```
   */
  listExperiencesEntries: (ListExperiencesEntries_listExperiencesEntries | null)[] | null;
}

export interface ListExperiencesEntriesVariables {
  input: ListExperiencesEntriesInput;
}

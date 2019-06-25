/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

import { ListEntriesFromExperiencesIdsInput } from "./globalTypes";

// ====================================================
// GraphQL query operation: ListEntriesFromExperiencesIds
// ====================================================

export interface ListEntriesFromExperiencesIds_listEntriesFromExperiencesIds_entryConnection_pageInfo {
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

export interface ListEntriesFromExperiencesIds_listEntriesFromExperiencesIds_entryConnection_edges_node_fields {
  __typename: "Field";
  defId: string;
  data: any;
}

export interface ListEntriesFromExperiencesIds_listEntriesFromExperiencesIds_entryConnection_edges_node {
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
  fields: (ListEntriesFromExperiencesIds_listEntriesFromExperiencesIds_entryConnection_edges_node_fields | null)[];
}

export interface ListEntriesFromExperiencesIds_listEntriesFromExperiencesIds_entryConnection_edges {
  __typename: "EntryEdge";
  /**
   * A cursor for use in pagination
   */
  cursor: string;
  /**
   * The item at the end of the edge
   */
  node: ListEntriesFromExperiencesIds_listEntriesFromExperiencesIds_entryConnection_edges_node | null;
}

export interface ListEntriesFromExperiencesIds_listEntriesFromExperiencesIds_entryConnection {
  __typename: "EntryConnection";
  pageInfo: ListEntriesFromExperiencesIds_listEntriesFromExperiencesIds_entryConnection_pageInfo;
  edges: (ListEntriesFromExperiencesIds_listEntriesFromExperiencesIds_entryConnection_edges | null)[] | null;
}

export interface ListEntriesFromExperiencesIds_listEntriesFromExperiencesIds {
  __typename: "ExperienceIdToEntryConnection";
  expId: string;
  entryConnection: ListEntriesFromExperiencesIds_listEntriesFromExperiencesIds_entryConnection;
}

export interface ListEntriesFromExperiencesIds {
  /**
   * Get entries for many experiences simultaneously. Use like so:
   * 
   *   query listEntriesFromExperiencesIds($input: listEntriesFromExperiencesIdsInput!) {
   *     listEntriesFromExperiencesIds(input: $input) {
   *       pageInfo {
   *         hasNextPage
   *         hasPreviousPage
   *       }
   * 
   *       edges {
   *         cursor
   *         node {
   *           ...EntryFragment
   *         }
   *       }
   *     }
   *   }
   * 
   *   You get:
   *   ```typescript
   *   {
   *     listEntriesFromExperiencesIds: [
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
  listEntriesFromExperiencesIds: (ListEntriesFromExperiencesIds_listEntriesFromExperiencesIds | null)[] | null;
}

export interface ListEntriesFromExperiencesIdsVariables {
  input: ListEntriesFromExperiencesIdsInput;
}

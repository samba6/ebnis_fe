/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

import { GetExpEntries } from "./globalTypes";

// ====================================================
// GraphQL query operation: GetExpAllEntries
// ====================================================

export interface GetExpAllEntries_expEntries_fields {
  __typename: "Field";
  defId: string;
  data: any;
}

export interface GetExpAllEntries_expEntries {
  __typename: "Entry";
  id: string;
  expId: string;
  fields: (GetExpAllEntries_expEntries_fields | null)[];
  insertedAt: any;
}

export interface GetExpAllEntries {
  /**
   * get all experiences belonging to a user
   */
  expEntries: (GetExpAllEntries_expEntries | null)[] | null;
}

export interface GetExpAllEntriesVariables {
  entry: GetExpEntries;
}

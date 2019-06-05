/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL fragment: EntryFrag
// ====================================================

export interface EntryFrag_fields {
  __typename: "Field";
  defId: string;
  data: any;
}

export interface EntryFrag {
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
   * The data fields belonging to this entry
   */
  fields: (EntryFrag_fields | null)[];
  insertedAt: any;
}

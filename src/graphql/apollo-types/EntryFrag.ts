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
  id: string;
  expId: string;
  fields: (EntryFrag_fields | null)[];
  insertedAt: any;
}

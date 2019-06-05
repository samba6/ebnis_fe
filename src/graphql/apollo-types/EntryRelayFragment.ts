/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL fragment: EntryRelayFragment
// ====================================================

export interface EntryRelayFragment_fields {
  __typename: "Field";
  defId: string;
  data: any;
}

export interface EntryRelayFragment {
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
  fields: (EntryRelayFragment_fields | null)[];
  insertedAt: any;
}

/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL fragment: CreateEntriesErrorFragment
// ====================================================

export interface CreateEntriesErrorFragment {
  __typename: "CreateEntriesError";
  /**
   * The experience ID of the entry which fails to save
   */
  experienceId: string;
  /**
   * The client ID of the entry which fails to save
   */
  clientId: string;
  /**
   * The failure error
   */
  error: string;
}

/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetExps
// ====================================================

export interface GetExps_exps {
  __typename: "Experience";
  id: string;
  title: string;
  description: string | null;
}

export interface GetExps {
  /**
   * get all experiences belonging to a user
   */
  exps: (GetExps_exps | null)[] | null;
}

/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

import { CreateExp } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: CreateExpMutation
// ====================================================

export interface CreateExpMutation_exp {
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
}

export interface CreateExpMutation {
  exp: CreateExpMutation_exp | null;
}

export interface CreateExpMutationVariables {
  exp: CreateExp;
}

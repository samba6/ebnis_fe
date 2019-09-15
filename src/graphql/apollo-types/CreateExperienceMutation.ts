/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

import { CreateExperienceInput, PaginationInput, DataTypes } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: CreateExperienceMutation
// ====================================================

export interface CreateExperienceMutation_createExperience_experience_dataDefinitions {
  __typename: "DataDefinition";
  id: string;
  /**
   * Name of field e.g start, end, meal
   */
  name: string;
  /**
   * The data type
   */
  type: DataTypes;
  /**
   * String that uniquely identifies this data definition has been
   *   created offline. If an associated entry is also created
   *   offline, then `dataDefinition.definitionId` **MUST BE** the same as this
   *   field and will be validated as such.
   */
  clientId: string | null;
}

export interface CreateExperienceMutation_createExperience_experience_entries_pageInfo {
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

export interface CreateExperienceMutation_createExperience_experience_entries_edges_node_dataObjects {
  __typename: "DataObject";
  id: string;
  data: any;
  definitionId: string;
  /**
   * Client ID indicates that data object was created offline
   */
  clientId: string | null;
  insertedAt: any;
  updatedAt: any;
}

export interface CreateExperienceMutation_createExperience_experience_entries_edges_node {
  __typename: "Entry";
  /**
   * Entry ID
   */
  id: string;
  /**
   * The ID of experience to which this entry belongs.
   */
  experienceId: string;
  /**
   * The client ID which indicates that an entry has been created while server
   *   is offline and is to be saved. The client ID uniquely
   *   identifies this entry and will be used to prevent conflict while saving entry
   *   created offline and must thus be non null in this situation.
   */
  clientId: string | null;
  insertedAt: any;
  updatedAt: any;
  /**
   * The list of data belonging to this entry.
   */
  dataObjects: (CreateExperienceMutation_createExperience_experience_entries_edges_node_dataObjects | null)[];
}

export interface CreateExperienceMutation_createExperience_experience_entries_edges {
  __typename: "EntryEdge";
  /**
   * A cursor for use in pagination
   */
  cursor: string;
  /**
   * The item at the end of the edge
   */
  node: CreateExperienceMutation_createExperience_experience_entries_edges_node | null;
}

export interface CreateExperienceMutation_createExperience_experience_entries {
  __typename: "EntryConnection";
  pageInfo: CreateExperienceMutation_createExperience_experience_entries_pageInfo;
  edges: (CreateExperienceMutation_createExperience_experience_entries_edges | null)[] | null;
}

export interface CreateExperienceMutation_createExperience_experience {
  __typename: "Experience";
  /**
   * The title of the experience
   */
  id: string;
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
  /**
   * The field definitions used for the experience entries
   */
  dataDefinitions: (CreateExperienceMutation_createExperience_experience_dataDefinitions | null)[];
  /**
   * The entries of the experience - can be paginated
   */
  entries: CreateExperienceMutation_createExperience_experience_entries;
}

export interface CreateExperienceMutation_createExperience_errors_dataDefinitionsErrors_errors {
  __typename: "DataDefinitionError";
  name: string | null;
  type: string | null;
}

export interface CreateExperienceMutation_createExperience_errors_dataDefinitionsErrors {
  __typename: "DataDefinitionErrors";
  index: number;
  errors: CreateExperienceMutation_createExperience_errors_dataDefinitionsErrors_errors;
}

export interface CreateExperienceMutation_createExperience_errors {
  __typename: "CreateExperienceErrors";
  clientId: string | null;
  title: string | null;
  user: string | null;
  dataDefinitionsErrors: (CreateExperienceMutation_createExperience_errors_dataDefinitionsErrors | null)[] | null;
}

export interface CreateExperienceMutation_createExperience {
  __typename: "CreateExperienceReturnValue";
  experience: CreateExperienceMutation_createExperience_experience | null;
  errors: CreateExperienceMutation_createExperience_errors | null;
}

export interface CreateExperienceMutation {
  /**
   * Create an experience
   */
  createExperience: CreateExperienceMutation_createExperience | null;
}

export interface CreateExperienceMutationVariables {
  createExperienceInput: CreateExperienceInput;
  entriesPagination: PaginationInput;
}

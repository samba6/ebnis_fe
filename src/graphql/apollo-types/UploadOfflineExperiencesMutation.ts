/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

import { CreateExperienceInput, DataTypes } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: UploadOfflineExperiencesMutation
// ====================================================

export interface UploadOfflineExperiencesMutation_saveOfflineExperiences_experience_dataDefinitions {
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

export interface UploadOfflineExperiencesMutation_saveOfflineExperiences_experience_entries_pageInfo {
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

export interface UploadOfflineExperiencesMutation_saveOfflineExperiences_experience_entries_edges_node_dataObjects {
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

export interface UploadOfflineExperiencesMutation_saveOfflineExperiences_experience_entries_edges_node {
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
  dataObjects: (UploadOfflineExperiencesMutation_saveOfflineExperiences_experience_entries_edges_node_dataObjects | null)[];
}

export interface UploadOfflineExperiencesMutation_saveOfflineExperiences_experience_entries_edges {
  __typename: "EntryEdge";
  /**
   * A cursor for use in pagination
   */
  cursor: string;
  /**
   * The item at the end of the edge
   */
  node: UploadOfflineExperiencesMutation_saveOfflineExperiences_experience_entries_edges_node | null;
}

export interface UploadOfflineExperiencesMutation_saveOfflineExperiences_experience_entries {
  __typename: "EntryConnection";
  pageInfo: UploadOfflineExperiencesMutation_saveOfflineExperiences_experience_entries_pageInfo;
  edges: (UploadOfflineExperiencesMutation_saveOfflineExperiences_experience_entries_edges | null)[] | null;
}

export interface UploadOfflineExperiencesMutation_saveOfflineExperiences_experience {
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
  dataDefinitions: (UploadOfflineExperiencesMutation_saveOfflineExperiences_experience_dataDefinitions | null)[];
  /**
   * The entries of the experience - can be paginated
   */
  entries: UploadOfflineExperiencesMutation_saveOfflineExperiences_experience_entries;
}

export interface UploadOfflineExperiencesMutation_saveOfflineExperiences_experienceErrors_errors_dataDefinitionsErrors_errors {
  __typename: "DataDefinitionError";
  name: string | null;
  type: string | null;
}

export interface UploadOfflineExperiencesMutation_saveOfflineExperiences_experienceErrors_errors_dataDefinitionsErrors {
  __typename: "DataDefinitionErrors";
  index: number;
  errors: UploadOfflineExperiencesMutation_saveOfflineExperiences_experienceErrors_errors_dataDefinitionsErrors_errors;
}

export interface UploadOfflineExperiencesMutation_saveOfflineExperiences_experienceErrors_errors {
  __typename: "CreateExperienceErrors";
  clientId: string | null;
  title: string | null;
  user: string | null;
  dataDefinitionsErrors: (UploadOfflineExperiencesMutation_saveOfflineExperiences_experienceErrors_errors_dataDefinitionsErrors | null)[] | null;
}

export interface UploadOfflineExperiencesMutation_saveOfflineExperiences_experienceErrors {
  __typename: "CreateOfflineExperienceErrors";
  /**
   * The client ID of the failing experience. As user may not have provided a
   *   client ID, this field is nullable and in that case, the index field will
   *   be used to identify this error
   */
  clientId: string;
  /**
   * The index of the failing experience in the list of experiences input
   */
  index: number;
  /**
   * The error object representing the insert failure reasons
   */
  errors: UploadOfflineExperiencesMutation_saveOfflineExperiences_experienceErrors_errors;
}

export interface UploadOfflineExperiencesMutation_saveOfflineExperiences_entriesErrors_errors_dataObjectsErrors_errors {
  __typename: "DataObjectError";
  data: string | null;
  definition: string | null;
  definitionId: string | null;
}

export interface UploadOfflineExperiencesMutation_saveOfflineExperiences_entriesErrors_errors_dataObjectsErrors {
  __typename: "DataObjectsErrors";
  index: number;
  errors: UploadOfflineExperiencesMutation_saveOfflineExperiences_entriesErrors_errors_dataObjectsErrors_errors;
}

export interface UploadOfflineExperiencesMutation_saveOfflineExperiences_entriesErrors_errors {
  __typename: "CreateEntryErrors";
  /**
   * May be because client ID is not unique for experience
   */
  clientId: string | null;
  /**
   * A catch-all field for when we are unable to create an entry
   */
  entry: string | null;
  /**
   * While saving an offline entry, its experience ID must be same as
   *   experience.clientId if saving entry via offline experience
   */
  experienceId: string | null;
  /**
   * Did we fail because, say, we did could not fetch the experience
   */
  experience: string | null;
  /**
   * Did we fail because there are errors in the data object object?
   */
  dataObjectsErrors: (UploadOfflineExperiencesMutation_saveOfflineExperiences_entriesErrors_errors_dataObjectsErrors | null)[] | null;
}

export interface UploadOfflineExperiencesMutation_saveOfflineExperiences_entriesErrors {
  __typename: "CreateEntriesErrors";
  /**
   * The experience ID of the entry which fails to save
   */
  experienceId: string;
  /**
   * The client ID of the entry which fails to save
   */
  clientId: string;
  errors: UploadOfflineExperiencesMutation_saveOfflineExperiences_entriesErrors_errors;
}

export interface UploadOfflineExperiencesMutation_saveOfflineExperiences {
  __typename: "OfflineExperience";
  /**
   * The experience which was successfully inserted
   *   - will be null if experience fails to insert
   */
  experience: UploadOfflineExperiencesMutation_saveOfflineExperiences_experience | null;
  /**
   * If the experience fails to insert, then this is the error object
   *   returned
   */
  experienceErrors: UploadOfflineExperiencesMutation_saveOfflineExperiences_experienceErrors | null;
  /**
   * A list of error objects denoting entries which fail to insert
   */
  entriesErrors: (UploadOfflineExperiencesMutation_saveOfflineExperiences_entriesErrors | null)[] | null;
}

export interface UploadOfflineExperiencesMutation {
  /**
   * Save many experiences created offline
   */
  saveOfflineExperiences: (UploadOfflineExperiencesMutation_saveOfflineExperiences | null)[] | null;
}

export interface UploadOfflineExperiencesMutationVariables {
  input: CreateExperienceInput[];
}

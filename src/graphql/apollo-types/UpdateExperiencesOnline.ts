/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

import { UpdateAnExperienceInput, DataTypes } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: UpdateExperiencesOnline
// ====================================================

export interface UpdateExperiencesOnline_updateExperiences_UpdateExperiencesAllFail {
  __typename: "UpdateExperiencesAllFail";
  /**
   * This will mostly be authorization error
   */
  error: string;
}

export interface UpdateExperiencesOnline_updateExperiences_UpdateExperiencesSomeSuccess_experiences_UpdateExperienceFullErrors_errors {
  __typename: "UpdateExperienceError";
  experienceId: string;
  /**
   * This will mostly be experience not found error
   */
  error: string;
}

export interface UpdateExperiencesOnline_updateExperiences_UpdateExperiencesSomeSuccess_experiences_UpdateExperienceFullErrors {
  __typename: "UpdateExperienceFullErrors";
  errors: UpdateExperiencesOnline_updateExperiences_UpdateExperiencesSomeSuccess_experiences_UpdateExperienceFullErrors_errors;
}

export interface UpdateExperiencesOnline_updateExperiences_UpdateExperiencesSomeSuccess_experiences_UpdateExperienceSomeSuccess_experience_ownFields_UpdateExperienceOwnFieldsErrors_errors {
  __typename: "UpdateExperienceOwnFieldsError";
  title: string;
}

export interface UpdateExperiencesOnline_updateExperiences_UpdateExperiencesSomeSuccess_experiences_UpdateExperienceSomeSuccess_experience_ownFields_UpdateExperienceOwnFieldsErrors {
  __typename: "UpdateExperienceOwnFieldsErrors";
  errors: UpdateExperiencesOnline_updateExperiences_UpdateExperiencesSomeSuccess_experiences_UpdateExperienceSomeSuccess_experience_ownFields_UpdateExperienceOwnFieldsErrors_errors;
}

export interface UpdateExperiencesOnline_updateExperiences_UpdateExperiencesSomeSuccess_experiences_UpdateExperienceSomeSuccess_experience_ownFields_ExperienceOwnFieldsSuccess_data {
  __typename: "ExperienceOwnFields";
  title: string;
  description: string | null;
}

export interface UpdateExperiencesOnline_updateExperiences_UpdateExperiencesSomeSuccess_experiences_UpdateExperienceSomeSuccess_experience_ownFields_ExperienceOwnFieldsSuccess {
  __typename: "ExperienceOwnFieldsSuccess";
  data: UpdateExperiencesOnline_updateExperiences_UpdateExperiencesSomeSuccess_experiences_UpdateExperienceSomeSuccess_experience_ownFields_ExperienceOwnFieldsSuccess_data;
}

export type UpdateExperiencesOnline_updateExperiences_UpdateExperiencesSomeSuccess_experiences_UpdateExperienceSomeSuccess_experience_ownFields = UpdateExperiencesOnline_updateExperiences_UpdateExperiencesSomeSuccess_experiences_UpdateExperienceSomeSuccess_experience_ownFields_UpdateExperienceOwnFieldsErrors | UpdateExperiencesOnline_updateExperiences_UpdateExperiencesSomeSuccess_experiences_UpdateExperienceSomeSuccess_experience_ownFields_ExperienceOwnFieldsSuccess;

export interface UpdateExperiencesOnline_updateExperiences_UpdateExperiencesSomeSuccess_experiences_UpdateExperienceSomeSuccess_experience_updatedDefinitions_DefinitionErrors_errors {
  __typename: "DefinitionError";
  /**
   * ID of the definition that failed
   */
  id: string;
  /**
   * The name of the definition is not unique or less than minimum char
   *   length
   */
  name: string | null;
  /**
   * The type is not in the list of allowed data types
   */
  type: string | null;
  /**
   * May be we can't find the definition during an update
   */
  error: string | null;
}

export interface UpdateExperiencesOnline_updateExperiences_UpdateExperiencesSomeSuccess_experiences_UpdateExperienceSomeSuccess_experience_updatedDefinitions_DefinitionErrors {
  __typename: "DefinitionErrors";
  errors: UpdateExperiencesOnline_updateExperiences_UpdateExperiencesSomeSuccess_experiences_UpdateExperienceSomeSuccess_experience_updatedDefinitions_DefinitionErrors_errors;
}

export interface UpdateExperiencesOnline_updateExperiences_UpdateExperiencesSomeSuccess_experiences_UpdateExperienceSomeSuccess_experience_updatedDefinitions_DefinitionSuccess_definition {
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

export interface UpdateExperiencesOnline_updateExperiences_UpdateExperiencesSomeSuccess_experiences_UpdateExperienceSomeSuccess_experience_updatedDefinitions_DefinitionSuccess {
  __typename: "DefinitionSuccess";
  definition: UpdateExperiencesOnline_updateExperiences_UpdateExperiencesSomeSuccess_experiences_UpdateExperienceSomeSuccess_experience_updatedDefinitions_DefinitionSuccess_definition;
}

export type UpdateExperiencesOnline_updateExperiences_UpdateExperiencesSomeSuccess_experiences_UpdateExperienceSomeSuccess_experience_updatedDefinitions = UpdateExperiencesOnline_updateExperiences_UpdateExperiencesSomeSuccess_experiences_UpdateExperienceSomeSuccess_experience_updatedDefinitions_DefinitionErrors | UpdateExperiencesOnline_updateExperiences_UpdateExperiencesSomeSuccess_experiences_UpdateExperienceSomeSuccess_experience_updatedDefinitions_DefinitionSuccess;

export interface UpdateExperiencesOnline_updateExperiences_UpdateExperiencesSomeSuccess_experiences_UpdateExperienceSomeSuccess_experience_updatedEntries_UpdateEntryErrors_errors {
  __typename: "UpdateEntryError";
  entryId: string;
  error: string;
}

export interface UpdateExperiencesOnline_updateExperiences_UpdateExperiencesSomeSuccess_experiences_UpdateExperienceSomeSuccess_experience_updatedEntries_UpdateEntryErrors {
  __typename: "UpdateEntryErrors";
  errors: UpdateExperiencesOnline_updateExperiences_UpdateExperiencesSomeSuccess_experiences_UpdateExperienceSomeSuccess_experience_updatedEntries_UpdateEntryErrors_errors | null;
}

export interface UpdateExperiencesOnline_updateExperiences_UpdateExperiencesSomeSuccess_experiences_UpdateExperienceSomeSuccess_experience_updatedEntries_UpdateEntrySomeSuccess_entry_dataObjects_DataObjectFullErrors_errors {
  __typename: "DataObjectFullError";
  id: string;
  definition: string | null;
  definitionId: string | null;
  clientId: string | null;
  /**
   * For generic errors unrelated to the fields of the data object e.g.
   *   not found error
   */
  error: string | null;
  /**
   * Error related to the data e.g. a string was supplied for a decimal field.
   */
  data: string | null;
}

export interface UpdateExperiencesOnline_updateExperiences_UpdateExperiencesSomeSuccess_experiences_UpdateExperienceSomeSuccess_experience_updatedEntries_UpdateEntrySomeSuccess_entry_dataObjects_DataObjectFullErrors {
  __typename: "DataObjectFullErrors";
  errors: UpdateExperiencesOnline_updateExperiences_UpdateExperiencesSomeSuccess_experiences_UpdateExperienceSomeSuccess_experience_updatedEntries_UpdateEntrySomeSuccess_entry_dataObjects_DataObjectFullErrors_errors;
}

export interface UpdateExperiencesOnline_updateExperiences_UpdateExperiencesSomeSuccess_experiences_UpdateExperienceSomeSuccess_experience_updatedEntries_UpdateEntrySomeSuccess_entry_dataObjects_DataObjectSuccess_dataObject {
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

export interface UpdateExperiencesOnline_updateExperiences_UpdateExperiencesSomeSuccess_experiences_UpdateExperienceSomeSuccess_experience_updatedEntries_UpdateEntrySomeSuccess_entry_dataObjects_DataObjectSuccess {
  __typename: "DataObjectSuccess";
  dataObject: UpdateExperiencesOnline_updateExperiences_UpdateExperiencesSomeSuccess_experiences_UpdateExperienceSomeSuccess_experience_updatedEntries_UpdateEntrySomeSuccess_entry_dataObjects_DataObjectSuccess_dataObject;
}

export type UpdateExperiencesOnline_updateExperiences_UpdateExperiencesSomeSuccess_experiences_UpdateExperienceSomeSuccess_experience_updatedEntries_UpdateEntrySomeSuccess_entry_dataObjects = UpdateExperiencesOnline_updateExperiences_UpdateExperiencesSomeSuccess_experiences_UpdateExperienceSomeSuccess_experience_updatedEntries_UpdateEntrySomeSuccess_entry_dataObjects_DataObjectFullErrors | UpdateExperiencesOnline_updateExperiences_UpdateExperiencesSomeSuccess_experiences_UpdateExperienceSomeSuccess_experience_updatedEntries_UpdateEntrySomeSuccess_entry_dataObjects_DataObjectSuccess;

export interface UpdateExperiencesOnline_updateExperiences_UpdateExperiencesSomeSuccess_experiences_UpdateExperienceSomeSuccess_experience_updatedEntries_UpdateEntrySomeSuccess_entry {
  __typename: "UpdateEntry";
  entryId: string;
  /**
   * If any entry data objects is updated, then the entry itself will
   *   be updated to the latest dataObject.updatedAt
   */
  updatedAt: any | null;
  dataObjects: UpdateExperiencesOnline_updateExperiences_UpdateExperiencesSomeSuccess_experiences_UpdateExperienceSomeSuccess_experience_updatedEntries_UpdateEntrySomeSuccess_entry_dataObjects[];
}

export interface UpdateExperiencesOnline_updateExperiences_UpdateExperiencesSomeSuccess_experiences_UpdateExperienceSomeSuccess_experience_updatedEntries_UpdateEntrySomeSuccess {
  __typename: "UpdateEntrySomeSuccess";
  entry: UpdateExperiencesOnline_updateExperiences_UpdateExperiencesSomeSuccess_experiences_UpdateExperienceSomeSuccess_experience_updatedEntries_UpdateEntrySomeSuccess_entry;
}

export type UpdateExperiencesOnline_updateExperiences_UpdateExperiencesSomeSuccess_experiences_UpdateExperienceSomeSuccess_experience_updatedEntries = UpdateExperiencesOnline_updateExperiences_UpdateExperiencesSomeSuccess_experiences_UpdateExperienceSomeSuccess_experience_updatedEntries_UpdateEntryErrors | UpdateExperiencesOnline_updateExperiences_UpdateExperiencesSomeSuccess_experiences_UpdateExperienceSomeSuccess_experience_updatedEntries_UpdateEntrySomeSuccess;

export interface UpdateExperiencesOnline_updateExperiences_UpdateExperiencesSomeSuccess_experiences_UpdateExperienceSomeSuccess_experience_newEntries_CreateEntryErrorss_errors_meta {
  __typename: "CreateEntryErrorMeta";
  index: number;
  clientId: string | null;
}

export interface UpdateExperiencesOnline_updateExperiences_UpdateExperiencesSomeSuccess_experiences_UpdateExperienceSomeSuccess_experience_newEntries_CreateEntryErrorss_errors_dataObjects {
  __typename: "DataObjectErrorx";
  index: number;
  definition: string | null;
  definitionId: string | null;
  data: string | null;
  clientId: string | null;
}

export interface UpdateExperiencesOnline_updateExperiences_UpdateExperiencesSomeSuccess_experiences_UpdateExperienceSomeSuccess_experience_newEntries_CreateEntryErrorss_errors {
  __typename: "CreateEntryErrorx";
  meta: UpdateExperiencesOnline_updateExperiences_UpdateExperiencesSomeSuccess_experiences_UpdateExperienceSomeSuccess_experience_newEntries_CreateEntryErrorss_errors_meta;
  /**
   * A catch-all field for when we are unable to create an entry
   */
  error: string | null;
  /**
   * May be we failed because entry.clientId is already taken by another
   *   entry belonging to the experience.
   */
  clientId: string | null;
  /**
   * An offline entry of offline experience must have its experience ID same as
   *   experience.clientId.
   */
  experienceId: string | null;
  /**
   * Did we fail because there are errors in the data object object?
   */
  dataObjects: (UpdateExperiencesOnline_updateExperiences_UpdateExperiencesSomeSuccess_experiences_UpdateExperienceSomeSuccess_experience_newEntries_CreateEntryErrorss_errors_dataObjects | null)[] | null;
}

export interface UpdateExperiencesOnline_updateExperiences_UpdateExperiencesSomeSuccess_experiences_UpdateExperienceSomeSuccess_experience_newEntries_CreateEntryErrorss {
  __typename: "CreateEntryErrorss";
  errors: UpdateExperiencesOnline_updateExperiences_UpdateExperiencesSomeSuccess_experiences_UpdateExperienceSomeSuccess_experience_newEntries_CreateEntryErrorss_errors;
}

export interface UpdateExperiencesOnline_updateExperiences_UpdateExperiencesSomeSuccess_experiences_UpdateExperienceSomeSuccess_experience_newEntries_CreateEntrySuccess_entry_dataObjects {
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

export interface UpdateExperiencesOnline_updateExperiences_UpdateExperiencesSomeSuccess_experiences_UpdateExperienceSomeSuccess_experience_newEntries_CreateEntrySuccess_entry {
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
   * Indicates whether entry has been modified offline, in which case this
   *   property will be true, otherwise it will be falsy
   */
  modOffline: boolean | null;
  /**
   * The list of data belonging to this entry.
   */
  dataObjects: (UpdateExperiencesOnline_updateExperiences_UpdateExperiencesSomeSuccess_experiences_UpdateExperienceSomeSuccess_experience_newEntries_CreateEntrySuccess_entry_dataObjects | null)[];
}

export interface UpdateExperiencesOnline_updateExperiences_UpdateExperiencesSomeSuccess_experiences_UpdateExperienceSomeSuccess_experience_newEntries_CreateEntrySuccess {
  __typename: "CreateEntrySuccess";
  entry: UpdateExperiencesOnline_updateExperiences_UpdateExperiencesSomeSuccess_experiences_UpdateExperienceSomeSuccess_experience_newEntries_CreateEntrySuccess_entry;
}

export type UpdateExperiencesOnline_updateExperiences_UpdateExperiencesSomeSuccess_experiences_UpdateExperienceSomeSuccess_experience_newEntries = UpdateExperiencesOnline_updateExperiences_UpdateExperiencesSomeSuccess_experiences_UpdateExperienceSomeSuccess_experience_newEntries_CreateEntryErrorss | UpdateExperiencesOnline_updateExperiences_UpdateExperiencesSomeSuccess_experiences_UpdateExperienceSomeSuccess_experience_newEntries_CreateEntrySuccess;

export interface UpdateExperiencesOnline_updateExperiences_UpdateExperiencesSomeSuccess_experiences_UpdateExperienceSomeSuccess_experience {
  __typename: "UpdateExperience";
  experienceId: string;
  updatedAt: any;
  ownFields: UpdateExperiencesOnline_updateExperiences_UpdateExperiencesSomeSuccess_experiences_UpdateExperienceSomeSuccess_experience_ownFields | null;
  updatedDefinitions: UpdateExperiencesOnline_updateExperiences_UpdateExperiencesSomeSuccess_experiences_UpdateExperienceSomeSuccess_experience_updatedDefinitions[] | null;
  updatedEntries: UpdateExperiencesOnline_updateExperiences_UpdateExperiencesSomeSuccess_experiences_UpdateExperienceSomeSuccess_experience_updatedEntries[] | null;
  newEntries: UpdateExperiencesOnline_updateExperiences_UpdateExperiencesSomeSuccess_experiences_UpdateExperienceSomeSuccess_experience_newEntries[] | null;
}

export interface UpdateExperiencesOnline_updateExperiences_UpdateExperiencesSomeSuccess_experiences_UpdateExperienceSomeSuccess {
  __typename: "UpdateExperienceSomeSuccess";
  experience: UpdateExperiencesOnline_updateExperiences_UpdateExperiencesSomeSuccess_experiences_UpdateExperienceSomeSuccess_experience;
}

export type UpdateExperiencesOnline_updateExperiences_UpdateExperiencesSomeSuccess_experiences = UpdateExperiencesOnline_updateExperiences_UpdateExperiencesSomeSuccess_experiences_UpdateExperienceFullErrors | UpdateExperiencesOnline_updateExperiences_UpdateExperiencesSomeSuccess_experiences_UpdateExperienceSomeSuccess;

export interface UpdateExperiencesOnline_updateExperiences_UpdateExperiencesSomeSuccess {
  __typename: "UpdateExperiencesSomeSuccess";
  experiences: UpdateExperiencesOnline_updateExperiences_UpdateExperiencesSomeSuccess_experiences[];
}

export type UpdateExperiencesOnline_updateExperiences = UpdateExperiencesOnline_updateExperiences_UpdateExperiencesAllFail | UpdateExperiencesOnline_updateExperiences_UpdateExperiencesSomeSuccess;

export interface UpdateExperiencesOnline {
  /**
   * Update several experiences at once
   */
  updateExperiences: UpdateExperiencesOnline_updateExperiences | null;
}

export interface UpdateExperiencesOnlineVariables {
  input: UpdateAnExperienceInput[];
}

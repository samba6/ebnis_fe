/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

import { DataTypes } from "./globalTypes";

// ====================================================
// GraphQL fragment: UpdateExperienceFragment
// ====================================================

export interface UpdateExperienceFragment_ownFields_UpdateExperienceOwnFieldsErrors_errors {
  __typename: "UpdateExperienceOwnFieldsError";
  title: string;
}

export interface UpdateExperienceFragment_ownFields_UpdateExperienceOwnFieldsErrors {
  __typename: "UpdateExperienceOwnFieldsErrors";
  errors: UpdateExperienceFragment_ownFields_UpdateExperienceOwnFieldsErrors_errors;
}

export interface UpdateExperienceFragment_ownFields_ExperienceOwnFieldsSuccess_data {
  __typename: "ExperienceOwnFields";
  title: string;
  description: string | null;
}

export interface UpdateExperienceFragment_ownFields_ExperienceOwnFieldsSuccess {
  __typename: "ExperienceOwnFieldsSuccess";
  data: UpdateExperienceFragment_ownFields_ExperienceOwnFieldsSuccess_data;
}

export type UpdateExperienceFragment_ownFields = UpdateExperienceFragment_ownFields_UpdateExperienceOwnFieldsErrors | UpdateExperienceFragment_ownFields_ExperienceOwnFieldsSuccess;

export interface UpdateExperienceFragment_updatedDefinitions_DefinitionErrors_errors {
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

export interface UpdateExperienceFragment_updatedDefinitions_DefinitionErrors {
  __typename: "DefinitionErrors";
  errors: UpdateExperienceFragment_updatedDefinitions_DefinitionErrors_errors;
}

export interface UpdateExperienceFragment_updatedDefinitions_DefinitionSuccess_definition {
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

export interface UpdateExperienceFragment_updatedDefinitions_DefinitionSuccess {
  __typename: "DefinitionSuccess";
  definition: UpdateExperienceFragment_updatedDefinitions_DefinitionSuccess_definition;
}

export type UpdateExperienceFragment_updatedDefinitions = UpdateExperienceFragment_updatedDefinitions_DefinitionErrors | UpdateExperienceFragment_updatedDefinitions_DefinitionSuccess;

export interface UpdateExperienceFragment_updatedEntries_UpdateEntryErrors_errors {
  __typename: "UpdateEntryError";
  entryId: string;
  error: string;
}

export interface UpdateExperienceFragment_updatedEntries_UpdateEntryErrors {
  __typename: "UpdateEntryErrors";
  errors: UpdateExperienceFragment_updatedEntries_UpdateEntryErrors_errors;
}

export interface UpdateExperienceFragment_updatedEntries_UpdateEntrySomeSuccess_entry_dataObjects_DataObjectErrors_errors_meta {
  __typename: "DataObjectErrorMeta";
  index: number;
  id: string | null;
  clientId: string | null;
}

export interface UpdateExperienceFragment_updatedEntries_UpdateEntrySomeSuccess_entry_dataObjects_DataObjectErrors_errors {
  __typename: "DataObjectError";
  meta: UpdateExperienceFragment_updatedEntries_UpdateEntrySomeSuccess_entry_dataObjects_DataObjectErrors_errors_meta;
  definition: string | null;
  definitionId: string | null;
  clientId: string | null;
  /**
   * Error related to the data e.g. a string was supplied for a decimal field.
   */
  data: string | null;
  /**
   * For generic errors unrelated to the fields of the data object e.g.
   *   not found error
   */
  error: string | null;
}

export interface UpdateExperienceFragment_updatedEntries_UpdateEntrySomeSuccess_entry_dataObjects_DataObjectErrors {
  __typename: "DataObjectErrors";
  errors: UpdateExperienceFragment_updatedEntries_UpdateEntrySomeSuccess_entry_dataObjects_DataObjectErrors_errors;
}

export interface UpdateExperienceFragment_updatedEntries_UpdateEntrySomeSuccess_entry_dataObjects_DataObjectSuccess_dataObject {
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

export interface UpdateExperienceFragment_updatedEntries_UpdateEntrySomeSuccess_entry_dataObjects_DataObjectSuccess {
  __typename: "DataObjectSuccess";
  dataObject: UpdateExperienceFragment_updatedEntries_UpdateEntrySomeSuccess_entry_dataObjects_DataObjectSuccess_dataObject;
}

export type UpdateExperienceFragment_updatedEntries_UpdateEntrySomeSuccess_entry_dataObjects = UpdateExperienceFragment_updatedEntries_UpdateEntrySomeSuccess_entry_dataObjects_DataObjectErrors | UpdateExperienceFragment_updatedEntries_UpdateEntrySomeSuccess_entry_dataObjects_DataObjectSuccess;

export interface UpdateExperienceFragment_updatedEntries_UpdateEntrySomeSuccess_entry {
  __typename: "UpdateEntry";
  entryId: string;
  /**
   * If any entry data objects is updated, then the entry itself will
   *   be updated to the latest dataObject.updatedAt
   */
  updatedAt: any | null;
  dataObjects: UpdateExperienceFragment_updatedEntries_UpdateEntrySomeSuccess_entry_dataObjects[];
}

export interface UpdateExperienceFragment_updatedEntries_UpdateEntrySomeSuccess {
  __typename: "UpdateEntrySomeSuccess";
  entry: UpdateExperienceFragment_updatedEntries_UpdateEntrySomeSuccess_entry;
}

export type UpdateExperienceFragment_updatedEntries = UpdateExperienceFragment_updatedEntries_UpdateEntryErrors | UpdateExperienceFragment_updatedEntries_UpdateEntrySomeSuccess;

export interface UpdateExperienceFragment_newEntries_CreateEntryErrors_errors_meta {
  __typename: "CreateEntryErrorMeta";
  experienceId: string;
  index: number;
  clientId: string | null;
}

export interface UpdateExperienceFragment_newEntries_CreateEntryErrors_errors_dataObjects_meta {
  __typename: "DataObjectErrorMeta";
  index: number;
  id: string | null;
  clientId: string | null;
}

export interface UpdateExperienceFragment_newEntries_CreateEntryErrors_errors_dataObjects {
  __typename: "DataObjectError";
  meta: UpdateExperienceFragment_newEntries_CreateEntryErrors_errors_dataObjects_meta;
  definition: string | null;
  definitionId: string | null;
  clientId: string | null;
  /**
   * Error related to the data e.g. a string was supplied for a decimal field.
   */
  data: string | null;
}

export interface UpdateExperienceFragment_newEntries_CreateEntryErrors_errors {
  __typename: "CreateEntryError";
  meta: UpdateExperienceFragment_newEntries_CreateEntryErrors_errors_meta;
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
  dataObjects: (UpdateExperienceFragment_newEntries_CreateEntryErrors_errors_dataObjects | null)[] | null;
}

export interface UpdateExperienceFragment_newEntries_CreateEntryErrors {
  __typename: "CreateEntryErrors";
  errors: UpdateExperienceFragment_newEntries_CreateEntryErrors_errors;
}

export interface UpdateExperienceFragment_newEntries_CreateEntrySuccess_entry_dataObjects {
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

export interface UpdateExperienceFragment_newEntries_CreateEntrySuccess_entry {
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
  dataObjects: (UpdateExperienceFragment_newEntries_CreateEntrySuccess_entry_dataObjects | null)[];
}

export interface UpdateExperienceFragment_newEntries_CreateEntrySuccess {
  __typename: "CreateEntrySuccess";
  entry: UpdateExperienceFragment_newEntries_CreateEntrySuccess_entry;
}

export type UpdateExperienceFragment_newEntries = UpdateExperienceFragment_newEntries_CreateEntryErrors | UpdateExperienceFragment_newEntries_CreateEntrySuccess;

export interface UpdateExperienceFragment_deletedEntries_EntrySuccess_entry_dataObjects {
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

export interface UpdateExperienceFragment_deletedEntries_EntrySuccess_entry {
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
  dataObjects: (UpdateExperienceFragment_deletedEntries_EntrySuccess_entry_dataObjects | null)[];
}

export interface UpdateExperienceFragment_deletedEntries_EntrySuccess {
  __typename: "EntrySuccess";
  entry: UpdateExperienceFragment_deletedEntries_EntrySuccess_entry;
}

export interface UpdateExperienceFragment_deletedEntries_DeleteEntryErrors_errors {
  __typename: "DeleteEntryError";
  id: string;
  /**
   * This will mostly be 'not found error'
   */
  error: string;
}

export interface UpdateExperienceFragment_deletedEntries_DeleteEntryErrors {
  __typename: "DeleteEntryErrors";
  errors: UpdateExperienceFragment_deletedEntries_DeleteEntryErrors_errors;
}

export type UpdateExperienceFragment_deletedEntries = UpdateExperienceFragment_deletedEntries_EntrySuccess | UpdateExperienceFragment_deletedEntries_DeleteEntryErrors;

export interface UpdateExperienceFragment {
  __typename: "UpdateExperience";
  experienceId: string;
  updatedAt: any;
  ownFields: UpdateExperienceFragment_ownFields | null;
  updatedDefinitions: UpdateExperienceFragment_updatedDefinitions[] | null;
  updatedEntries: UpdateExperienceFragment_updatedEntries[] | null;
  newEntries: UpdateExperienceFragment_newEntries[] | null;
  deletedEntries: UpdateExperienceFragment_deletedEntries[] | null;
}

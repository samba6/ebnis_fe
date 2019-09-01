/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

import { UpdateDataObjectInput, UpdateDefinitionInput, FieldType } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: UpdateDefinitionAndData
// ====================================================

export interface UpdateDefinitionAndData_updateDataObjects_dataObject {
  __typename: "DataObject";
  id: string;
  data: any;
  definitionId: string;
}

export interface UpdateDefinitionAndData_updateDataObjects_fieldErrors {
  __typename: "DataObjectError";
  definition: string | null;
  definitionId: string | null;
  data: string | null;
}

export interface UpdateDefinitionAndData_updateDataObjects {
  __typename: "UpdateDataObjectsResponse";
  /**
   * The ID of data object to be updated
   */
  id: string;
  /**
   * The index of the data object in the list of data objects
   */
  index: number;
  /**
   * For errors unrelated to the fields of the data object (e.g. we
   *   could not find the subject in the DB)
   */
  stringError: string | null;
  /**
   * If we are successful, then user gets back this object representing
   *   successful update
   */
  dataObject: UpdateDefinitionAndData_updateDataObjects_dataObject | null;
  /**
   * Represents errors relating to the fields of the data object
   */
  fieldErrors: UpdateDefinitionAndData_updateDataObjects_fieldErrors | null;
}

export interface UpdateDefinitionAndData_updateDefinitions_experience {
  __typename: "Experience";
  /**
   * The ID of an object
   */
  id: string;
  updatedAt: any;
}

export interface UpdateDefinitionAndData_updateDefinitions_definitions_definition {
  __typename: "DataDefinition";
  id: string;
  /**
   * Name of field e.g start, end, meal
   */
  name: string;
  /**
   * The data type of the field
   */
  type: FieldType;
  /**
   * String that uniquely identifies this data definition has been
   *   created offline. If an associated entry is also created
   *   offline, then `dataDefinition.definitionId` **MUST BE** the same as this
   *   field and will be validated as such.
   */
  clientId: string | null;
}

export interface UpdateDefinitionAndData_updateDefinitions_definitions_errors_errors {
  __typename: "DataDefinitionError";
  /**
   * May be we can't find the definition during an update
   */
  definition: string | null;
  name: string | null;
}

export interface UpdateDefinitionAndData_updateDefinitions_definitions_errors {
  __typename: "UpdateDefinitionError";
  id: string;
  errors: UpdateDefinitionAndData_updateDefinitions_definitions_errors_errors;
}

export interface UpdateDefinitionAndData_updateDefinitions_definitions {
  __typename: "UpdateDefinitionResponse";
  definition: UpdateDefinitionAndData_updateDefinitions_definitions_definition | null;
  errors: UpdateDefinitionAndData_updateDefinitions_definitions_errors | null;
}

export interface UpdateDefinitionAndData_updateDefinitions {
  __typename: "UpdateDefinitionsResponse";
  /**
   * The experience to which the definitions updated belong. The experience
   *   is always updated whenever a definition is updated with the most recent
   *   updatedAt field of the definitions to be updated.
   */
  experience: UpdateDefinitionAndData_updateDefinitions_experience;
  /**
   * The definitions to be updated, successes/failures
   */
  definitions: UpdateDefinitionAndData_updateDefinitions_definitions[];
}

export interface UpdateDefinitionAndData {
  updateDataObjects: (UpdateDefinitionAndData_updateDataObjects | null)[] | null;
  /**
   * Update several definitions
   */
  updateDefinitions: UpdateDefinitionAndData_updateDefinitions | null;
}

export interface UpdateDefinitionAndDataVariables {
  dataInput: UpdateDataObjectInput[];
  definitionsInput: UpdateDefinitionInput[];
}

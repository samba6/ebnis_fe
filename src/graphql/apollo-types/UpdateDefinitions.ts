/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

import { UpdateDefinitionsInput, DataTypes } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: UpdateDefinitions
// ====================================================

export interface UpdateDefinitions_updateDefinitions_experience {
  __typename: "Experience";
  /**
   * The title of the experience
   */
  id: string;
  updatedAt: any;
}

export interface UpdateDefinitions_updateDefinitions_definitions_definition {
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

export interface UpdateDefinitions_updateDefinitions_definitions_errors_errors {
  __typename: "DataDefinitionError";
  /**
   * May be we can't find the definition during an update
   */
  definition: string | null;
  name: string | null;
}

export interface UpdateDefinitions_updateDefinitions_definitions_errors {
  __typename: "UpdateDefinitionError";
  id: string;
  errors: UpdateDefinitions_updateDefinitions_definitions_errors_errors;
}

export interface UpdateDefinitions_updateDefinitions_definitions {
  __typename: "UpdateDefinitionResponse";
  definition: UpdateDefinitions_updateDefinitions_definitions_definition | null;
  errors: UpdateDefinitions_updateDefinitions_definitions_errors | null;
}

export interface UpdateDefinitions_updateDefinitions {
  __typename: "UpdateDefinitionsResponse";
  /**
   * The experience to which the definitions updated belong. The experience
   *   is always updated whenever a definition is updated with the most recent
   *   updatedAt field of the definitions to be updated.
   */
  experience: UpdateDefinitions_updateDefinitions_experience;
  /**
   * The definitions to be updated, successes/failures
   */
  definitions: UpdateDefinitions_updateDefinitions_definitions[];
}

export interface UpdateDefinitions {
  /**
   * Update several definitions
   */
  updateDefinitions: UpdateDefinitions_updateDefinitions | null;
}

export interface UpdateDefinitionsVariables {
  input: UpdateDefinitionsInput;
}

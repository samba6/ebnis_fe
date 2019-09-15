/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

import { DataTypes } from "./globalTypes";

// ====================================================
// GraphQL fragment: UpdateDefinitionsResponseFragment
// ====================================================

export interface UpdateDefinitionsResponseFragment_experience {
  __typename: "Experience";
  /**
   * The title of the experience
   */
  id: string;
  updatedAt: any;
}

export interface UpdateDefinitionsResponseFragment_definitions_definition {
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

export interface UpdateDefinitionsResponseFragment_definitions_errors_errors {
  __typename: "DataDefinitionError";
  /**
   * May be we can't find the definition during an update
   */
  definition: string | null;
  name: string | null;
}

export interface UpdateDefinitionsResponseFragment_definitions_errors {
  __typename: "UpdateDefinitionError";
  id: string;
  errors: UpdateDefinitionsResponseFragment_definitions_errors_errors;
}

export interface UpdateDefinitionsResponseFragment_definitions {
  __typename: "UpdateDefinitionResponse";
  definition: UpdateDefinitionsResponseFragment_definitions_definition | null;
  errors: UpdateDefinitionsResponseFragment_definitions_errors | null;
}

export interface UpdateDefinitionsResponseFragment {
  __typename: "UpdateDefinitionsResponse";
  /**
   * The experience to which the definitions updated belong. The experience
   *   is always updated whenever a definition is updated with the most recent
   *   updatedAt field of the definitions to be updated.
   */
  experience: UpdateDefinitionsResponseFragment_experience;
  /**
   * The definitions to be updated, successes/failures
   */
  definitions: UpdateDefinitionsResponseFragment_definitions[];
}

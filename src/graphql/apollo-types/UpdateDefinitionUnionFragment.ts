/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

import { DataTypes } from "./globalTypes";

// ====================================================
// GraphQL fragment: UpdateDefinitionUnionFragment
// ====================================================

export interface UpdateDefinitionUnionFragment_DefinitionErrors_errors {
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

export interface UpdateDefinitionUnionFragment_DefinitionErrors {
  __typename: "DefinitionErrors";
  errors: UpdateDefinitionUnionFragment_DefinitionErrors_errors;
}

export interface UpdateDefinitionUnionFragment_DefinitionSuccess_definition {
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

export interface UpdateDefinitionUnionFragment_DefinitionSuccess {
  __typename: "DefinitionSuccess";
  definition: UpdateDefinitionUnionFragment_DefinitionSuccess_definition;
}

export type UpdateDefinitionUnionFragment = UpdateDefinitionUnionFragment_DefinitionErrors | UpdateDefinitionUnionFragment_DefinitionSuccess;

/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL fragment: DefinitionErrorFragment
// ====================================================

export interface DefinitionErrorFragment {
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

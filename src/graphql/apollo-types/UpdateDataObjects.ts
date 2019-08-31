/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

import { UpdateDataObjectInput } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: UpdateDataObjects
// ====================================================

export interface UpdateDataObjects_updateDataObjects_dataObject {
  __typename: "DataObject";
  id: string;
  data: any;
  definitionId: string;
}

export interface UpdateDataObjects_updateDataObjects_fieldErrors {
  __typename: "DataObjectError";
  definition: string | null;
  definitionId: string | null;
  data: string | null;
}

export interface UpdateDataObjects_updateDataObjects {
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
  dataObject: UpdateDataObjects_updateDataObjects_dataObject | null;
  /**
   * Represents errors relating to the fields of the data object
   */
  fieldErrors: UpdateDataObjects_updateDataObjects_fieldErrors | null;
}

export interface UpdateDataObjects {
  updateDataObjects: (UpdateDataObjects_updateDataObjects | null)[] | null;
}

export interface UpdateDataObjectsVariables {
  input: UpdateDataObjectInput[];
}

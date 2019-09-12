/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL fragment: UpdateDataObjectsResponseFragment
// ====================================================

export interface UpdateDataObjectsResponseFragment_dataObject {
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

export interface UpdateDataObjectsResponseFragment_fieldErrors {
  __typename: "DataObjectError";
  definition: string | null;
  definitionId: string | null;
  data: string | null;
}

export interface UpdateDataObjectsResponseFragment {
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
  dataObject: UpdateDataObjectsResponseFragment_dataObject | null;
  /**
   * Represents errors relating to the fields of the data object
   */
  fieldErrors: UpdateDataObjectsResponseFragment_fieldErrors | null;
}

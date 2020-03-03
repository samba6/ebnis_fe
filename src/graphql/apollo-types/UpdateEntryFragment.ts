/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL fragment: UpdateEntryFragment
// ====================================================

export interface UpdateEntryFragment_dataObjects_DataObjectErrors_errors_meta {
  __typename: "DataObjectErrorMeta";
  index: number;
  id: string | null;
  clientId: string | null;
}

export interface UpdateEntryFragment_dataObjects_DataObjectErrors_errors {
  __typename: "DataObjectError";
  meta: UpdateEntryFragment_dataObjects_DataObjectErrors_errors_meta;
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

export interface UpdateEntryFragment_dataObjects_DataObjectErrors {
  __typename: "DataObjectErrors";
  errors: UpdateEntryFragment_dataObjects_DataObjectErrors_errors;
}

export interface UpdateEntryFragment_dataObjects_DataObjectSuccess_dataObject {
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

export interface UpdateEntryFragment_dataObjects_DataObjectSuccess {
  __typename: "DataObjectSuccess";
  dataObject: UpdateEntryFragment_dataObjects_DataObjectSuccess_dataObject;
}

export type UpdateEntryFragment_dataObjects = UpdateEntryFragment_dataObjects_DataObjectErrors | UpdateEntryFragment_dataObjects_DataObjectSuccess;

export interface UpdateEntryFragment {
  __typename: "UpdateEntry";
  entryId: string;
  /**
   * If any entry data objects is updated, then the entry itself will
   *   be updated to the latest dataObject.updatedAt
   */
  updatedAt: any | null;
  dataObjects: UpdateEntryFragment_dataObjects[];
}

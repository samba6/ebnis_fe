/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

//==============================================================
// START Enums and Input Objects
//==============================================================

/**
 * The possible field type that can be defined for an experience
 */
export enum FieldType {
  DATE = "DATE",
  DATETIME = "DATETIME",
  DECIMAL = "DECIMAL",
  INTEGER = "INTEGER",
  MULTI_LINE_TEXT = "MULTI_LINE_TEXT",
  SINGLE_LINE_TEXT = "SINGLE_LINE_TEXT",
}

/**
 * Variables for creating an experience entry
 */
export interface CreateEntryInput {
  clientId?: string | null;
  expId: string;
  fields: (CreateField | null)[];
  insertedAt?: any | null;
  updatedAt?: any | null;
}

/**
 * Variables for defining a new Experience
 */
export interface CreateExperienceInput {
  clientId?: string | null;
  description?: string | null;
  entries?: (CreateEntryInput | null)[] | null;
  fieldDefs: (CreateFieldDef | null)[];
  insertedAt?: any | null;
  title: string;
  updatedAt?: any | null;
}

/**
 * Variables for creating an entry field
 * 
 * It is of the form:
 * {
 *   defId: string;
 *   data: JSON_string;
 * }
 * 
 * The `defId` key comes from experience to which this entry is associated and
 * using this `defId`, we will retrieve the associated field definition for
 * each field so as to ensure that we are storing valid JSON string data for
 * the field. For instance, if user submits a field with JSON string data:
 *     {date: "2016-05-10"}
 * and defId:
 *     field_definition_id_10000
 * but when we query the experience for field definition id
 * `field_definition_id_10000`, it tells us it should be associated with an
 * integer data, then we will return error with explanation `invalid data type`
 * for this field.
 */
export interface CreateField {
  data: any;
  defId: string;
}

/**
 * Variables for defining field while defining a new experience
 */
export interface CreateFieldDef {
  clientId?: string | null;
  name: string;
  type: FieldType;
}

export interface GetExperiencesInput {
  ids?: (string | null)[] | null;
  pagination?: PaginationInput | null;
}

/**
 * Variables for login in User
 */
export interface LoginUser {
  email: string;
  password: string;
}

export interface PaginationInput {
  after?: number | null;
  before?: number | null;
  first?: number | null;
  last?: number | null;
}

/**
 * Variables for creating User and credential
 */
export interface Registration {
  email: string;
  name: string;
  password: string;
  passwordConfirmation: string;
  source: string;
}

//==============================================================
// END Enums and Input Objects
//==============================================================

/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

//==============================================================
// START Enums and Input Objects
//==============================================================

export enum FieldType {
  DATE = "DATE",
  DATETIME = "DATETIME",
  DECIMAL = "DECIMAL",
  INTEGER = "INTEGER",
  MULTI_LINE_TEXT = "MULTI_LINE_TEXT",
  SINGLE_LINE_TEXT = "SINGLE_LINE_TEXT",
}

/**
 * Variables for creating an xperience entry
 */
export interface CreateEntry {
  expId: string;
  fields: (CreateField | null)[];
}

/**
 * Variables for creating Experience
 */
export interface CreateExp {
  description?: string | null;
  fieldDefs: (CreateFieldDef | null)[];
  title: string;
}

/**
 * Variables for creating an entry field
 */
export interface CreateField {
  data: any;
  defId: string;
}

/**
 * Variables for creating field for an existing experience
 */
export interface CreateFieldDef {
  name: string;
  type: FieldType;
}

/**
 * Variables for getting an experience
 */
export interface GetExp {
  id: string;
}

/**
 * Variables for getting all entries belonging to an experience
 */
export interface GetExpEntries {
  expId: string;
}

/**
 * Variables for login in User
 */
export interface LoginUser {
  email: string;
  password: string;
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

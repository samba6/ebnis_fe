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
  INTEGER1 = "INTEGER1",
  MULTI_LINE_TEXT = "MULTI_LINE_TEXT",
  SINGLE_LINE_TEXT = "SINGLE_LINE_TEXT",
}

/**
 * Variables for defining field while defining a new experience
 */
export interface CreateDataDefinition {
  clientId?: string | null;
  name: string;
  type: FieldType;
}

/**
 * Variables for creating an entry field
 */
export interface CreateDataObject {
  data: any;
  definitionId: string;
}

export interface CreateEntriesInput {
  clientId: string;
  dataObjects: (CreateDataObject | null)[];
  experienceId: string;
  insertedAt?: any | null;
  updatedAt?: any | null;
}

/**
 * Variables for creating an experience entry
 */
export interface CreateEntryInput {
  clientId?: string | null;
  dataObjects: (CreateDataObject | null)[];
  experienceId: string;
  insertedAt?: any | null;
  updatedAt?: any | null;
}

/**
 * Input object for defining a new Experience
 */
export interface CreateExperienceInput {
  clientId?: string | null;
  dataDefinitions: (CreateDataDefinition | null)[];
  description?: string | null;
  entries?: (CreateEntryInput | null)[] | null;
  insertedAt?: any | null;
  title: string;
  updatedAt?: any | null;
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

/**
 * Variables for updating an existing Experience
 */
export interface UpdateExperienceInput {
  description?: string | null;
  id: string;
  title?: string | null;
}

//==============================================================
// END Enums and Input Objects
//==============================================================

/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

//==============================================================
// START Enums and Input Objects
//==============================================================

/**
 * The possible data type that can be defined for an experience
 */
export enum DataTypes {
  DATE = "DATE",
  DATETIME = "DATETIME",
  DECIMAL = "DECIMAL",
  INTEGER = "INTEGER",
  MULTI_LINE_TEXT = "MULTI_LINE_TEXT",
  SINGLE_LINE_TEXT = "SINGLE_LINE_TEXT",
}

/**
 * Variables for defining field while defining a new experience
 */
export interface CreateDataDefinition {
  clientId?: string | null;
  name: string;
  type: DataTypes;
}

/**
 * Variables for creating an entry field
 */
export interface CreateDataObject {
  clientId?: string | null;
  data: any;
  definitionId: string;
  insertedAt?: any | null;
  updatedAt?: any | null;
}

export interface CreateEntryInput {
  clientId?: string | null;
  dataObjects: CreateDataObject[];
  experienceId?: string | null;
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

export interface UpdateDataObjectInput {
  data: any;
  id: string;
  updatedAt?: any | null;
}

/**
 * fields required to update an experience data definition
 */
export interface UpdateDefinitionInput {
  id: string;
  name: string;
  updatedAt?: any | null;
}

/**
 * An input object for updating an entry when updating several entries at once
 */
export interface UpdateEntryInput {
  dataObjects: UpdateDataObjectInput[];
  entryId: string;
}

/**
 * Input variables for updating an experience
 */
export interface UpdateExperienceInput {
  addEntries?: CreateEntryInput[] | null;
  deleteEntries?: string[] | null;
  experienceId: string;
  ownFields?: UpdateExperienceOwnFieldsInput | null;
  updateDefinitions?: UpdateDefinitionInput[] | null;
  updateEntries?: UpdateEntryInput[] | null;
}

/**
 * Input variables for updating own fields of an experience as opposed to
 * objects owned by the experience e.g. dataDefinition, entry
 */
export interface UpdateExperienceOwnFieldsInput {
  description?: string | null;
  title?: string | null;
}

//==============================================================
// END Enums and Input Objects
//==============================================================

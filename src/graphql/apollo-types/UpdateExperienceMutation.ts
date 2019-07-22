/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

import { UpdateExperienceInput, FieldType } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: UpdateExperienceMutation
// ====================================================

export interface UpdateExperienceMutation_updateExperience_experience_fieldDefs {
  __typename: "FieldDef";
  id: string;
  /**
   * Name of field e.g start, end, meal
   */
  name: string;
  /**
   * The data type of the field
   */
  type: FieldType;
  /**
   * String that uniquely identifies this field definition has been
   *   created offline. If an associated entry is also created
   *   offline, then `createField.defId` **MUST BE** the same as this
   *   field and will be validated as such.
   */
  clientId: string | null;
}

export interface UpdateExperienceMutation_updateExperience_experience {
  __typename: "Experience";
  /**
   * The ID of an object
   */
  id: string;
  /**
   * The title of the experience
   */
  title: string;
  /**
   * The description of the experience
   */
  description: string | null;
  /**
   * The client ID. For experiences created on the client while server is
   *   offline and to be saved , the client ID uniquely identifies such and can
   *   be used to enforce uniqueness at the DB level. Not providing client_id
   *   assumes a fresh experience.
   */
  clientId: string | null;
  insertedAt: any;
  updatedAt: any;
  hasUnsaved: boolean | null;
  /**
   * The field definitions used for the experience entries
   */
  fieldDefs: (UpdateExperienceMutation_updateExperience_experience_fieldDefs | null)[];
}

export interface UpdateExperienceMutation_updateExperience_experienceError {
  __typename: "ExperienceError";
  id: string | null;
  title: string | null;
}

export interface UpdateExperienceMutation_updateExperience_fieldDefinitionsErrors {
  __typename: "FieldDefinitionsErrors";
  id: string;
  name: string | null;
}

export interface UpdateExperienceMutation_updateExperience {
  __typename: "ExperienceUpdateReturned";
  experience: UpdateExperienceMutation_updateExperience_experience | null;
  experienceError: UpdateExperienceMutation_updateExperience_experienceError | null;
  fieldDefinitionsErrors: (UpdateExperienceMutation_updateExperience_fieldDefinitionsErrors | null)[] | null;
}

export interface UpdateExperienceMutation {
  /**
   * Update an experience
   */
  updateExperience: UpdateExperienceMutation_updateExperience | null;
}

export interface UpdateExperienceMutationVariables {
  input: UpdateExperienceInput;
}

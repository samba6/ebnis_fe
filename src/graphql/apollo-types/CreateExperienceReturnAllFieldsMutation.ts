/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

import { CreateExp, FieldType } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: CreateExperienceReturnAllFieldsMutation
// ====================================================

export interface CreateExperienceReturnAllFieldsMutation_exp_fieldDefs {
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
}

export interface CreateExperienceReturnAllFieldsMutation_exp {
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
   * The field definitions used for the experience entries
   */
  fieldDefs: (CreateExperienceReturnAllFieldsMutation_exp_fieldDefs | null)[];
}

export interface CreateExperienceReturnAllFieldsMutation {
  exp: CreateExperienceReturnAllFieldsMutation_exp | null;
}

export interface CreateExperienceReturnAllFieldsMutationVariables {
  exp: CreateExp;
}

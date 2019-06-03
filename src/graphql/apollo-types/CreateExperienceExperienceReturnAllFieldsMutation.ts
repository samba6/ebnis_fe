/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

import { CreateExp, FieldType } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: CreateExperienceExperienceReturnAllFieldsMutation
// ====================================================

export interface CreateExperienceExperienceReturnAllFieldsMutation_exp_fieldDefs {
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

export interface CreateExperienceExperienceReturnAllFieldsMutation_exp {
  __typename: "Experience";
  id: string;
  title: string;
  description: string | null;
  /**
   * The field definitions used for the experience entries
   */
  fieldDefs: (CreateExperienceExperienceReturnAllFieldsMutation_exp_fieldDefs | null)[];
}

export interface CreateExperienceExperienceReturnAllFieldsMutation {
  exp: CreateExperienceExperienceReturnAllFieldsMutation_exp | null;
}

export interface CreateExperienceExperienceReturnAllFieldsMutationVariables {
  exp: CreateExp;
}

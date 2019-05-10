/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

import { GetExp, FieldType } from "./globalTypes";

// ====================================================
// GraphQL query operation: GetAnExp
// ====================================================

export interface GetAnExp_exp_fieldDefs {
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

export interface GetAnExp_exp {
  __typename: "Experience";
  id: string;
  title: string;
  description: string | null;
  /**
   * The field definitions used for the experience entries
   */
  fieldDefs: (GetAnExp_exp_fieldDefs | null)[];
}

export interface GetAnExp {
  /**
   * get an experience
   */
  exp: GetAnExp_exp | null;
}

export interface GetAnExpVariables {
  exp: GetExp;
}

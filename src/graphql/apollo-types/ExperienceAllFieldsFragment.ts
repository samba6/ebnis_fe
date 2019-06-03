/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

import { FieldType } from "./globalTypes";

// ====================================================
// GraphQL fragment: ExperienceAllFieldsFragment
// ====================================================

export interface ExperienceAllFieldsFragment_fieldDefs {
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

export interface ExperienceAllFieldsFragment {
  __typename: "Experience";
  id: string;
  title: string;
  description: string | null;
  /**
   * The field definitions used for the experience entries
   */
  fieldDefs: (ExperienceAllFieldsFragment_fieldDefs | null)[];
}

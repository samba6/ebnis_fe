/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL fragment: UpdateExperienceOwnFieldsUnionFragment
// ====================================================

export interface UpdateExperienceOwnFieldsUnionFragment_UpdateExperienceOwnFieldsErrors_errors {
  __typename: "UpdateExperienceOwnFieldsError";
  title: string;
}

export interface UpdateExperienceOwnFieldsUnionFragment_UpdateExperienceOwnFieldsErrors {
  __typename: "UpdateExperienceOwnFieldsErrors";
  errors: UpdateExperienceOwnFieldsUnionFragment_UpdateExperienceOwnFieldsErrors_errors;
}

export interface UpdateExperienceOwnFieldsUnionFragment_ExperienceOwnFieldsSuccess_data {
  __typename: "ExperienceOwnFields";
  title: string;
  description: string | null;
}

export interface UpdateExperienceOwnFieldsUnionFragment_ExperienceOwnFieldsSuccess {
  __typename: "ExperienceOwnFieldsSuccess";
  data: UpdateExperienceOwnFieldsUnionFragment_ExperienceOwnFieldsSuccess_data;
}

export type UpdateExperienceOwnFieldsUnionFragment = UpdateExperienceOwnFieldsUnionFragment_UpdateExperienceOwnFieldsErrors | UpdateExperienceOwnFieldsUnionFragment_ExperienceOwnFieldsSuccess;

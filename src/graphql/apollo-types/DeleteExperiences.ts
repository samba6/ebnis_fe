/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: DeleteExperiences
// ====================================================

export interface DeleteExperiences_deleteExperiences_DeleteExperiencesAllFail {
  __typename: "DeleteExperiencesAllFail";
  /**
   * This will mostly be authorization error
   */
  error: string;
}

export interface DeleteExperiences_deleteExperiences_DeleteExperiencesSomeSuccess_experiences_DeleteExperienceErrors_errors {
  __typename: "DeleteExperienceError";
  id: string;
  error: string;
}

export interface DeleteExperiences_deleteExperiences_DeleteExperiencesSomeSuccess_experiences_DeleteExperienceErrors {
  __typename: "DeleteExperienceErrors";
  errors: DeleteExperiences_deleteExperiences_DeleteExperiencesSomeSuccess_experiences_DeleteExperienceErrors_errors;
}

export interface DeleteExperiences_deleteExperiences_DeleteExperiencesSomeSuccess_experiences_DeleteExperienceSuccess_experience {
  __typename: "Experience";
  /**
   * The title of the experience
   */
  id: string;
}

export interface DeleteExperiences_deleteExperiences_DeleteExperiencesSomeSuccess_experiences_DeleteExperienceSuccess {
  __typename: "DeleteExperienceSuccess";
  experience: DeleteExperiences_deleteExperiences_DeleteExperiencesSomeSuccess_experiences_DeleteExperienceSuccess_experience;
}

export type DeleteExperiences_deleteExperiences_DeleteExperiencesSomeSuccess_experiences = DeleteExperiences_deleteExperiences_DeleteExperiencesSomeSuccess_experiences_DeleteExperienceErrors | DeleteExperiences_deleteExperiences_DeleteExperiencesSomeSuccess_experiences_DeleteExperienceSuccess;

export interface DeleteExperiences_deleteExperiences_DeleteExperiencesSomeSuccess {
  __typename: "DeleteExperiencesSomeSuccess";
  experiences: DeleteExperiences_deleteExperiences_DeleteExperiencesSomeSuccess_experiences[];
}

export type DeleteExperiences_deleteExperiences = DeleteExperiences_deleteExperiences_DeleteExperiencesAllFail | DeleteExperiences_deleteExperiences_DeleteExperiencesSomeSuccess;

export interface DeleteExperiences {
  /**
   * Delete several experiences
   */
  deleteExperiences: DeleteExperiences_deleteExperiences | null;
}

export interface DeleteExperiencesVariables {
  input: string[];
}

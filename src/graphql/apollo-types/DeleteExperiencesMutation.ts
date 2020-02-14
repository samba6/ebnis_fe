/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: DeleteExperiencesMutation
// ====================================================

export interface DeleteExperiencesMutation_deleteExperiences {
  __typename: "DeleteExperiencesSomeSuccess" | "DeleteExperiencesAllFail";
}

export interface DeleteExperiencesMutation {
  /**
   * Delete several experiences
   */
  deleteExperiences: DeleteExperiencesMutation_deleteExperiences | null;
}

export interface DeleteExperiencesMutationVariables {
  input: string[];
}

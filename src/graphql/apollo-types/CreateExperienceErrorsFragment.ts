/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL fragment: CreateExperienceErrorsFragment
// ====================================================

export interface CreateExperienceErrorsFragment_dataDefinitionsErrors_errors {
  __typename: "DataDefinitionError";
  name: string | null;
  type: string | null;
}

export interface CreateExperienceErrorsFragment_dataDefinitionsErrors {
  __typename: "DataDefinitionErrors";
  index: number;
  errors: CreateExperienceErrorsFragment_dataDefinitionsErrors_errors;
}

export interface CreateExperienceErrorsFragment {
  __typename: "CreateExperienceErrors";
  clientId: string | null;
  title: string | null;
  user: string | null;
  dataDefinitionsErrors: (CreateExperienceErrorsFragment_dataDefinitionsErrors | null)[] | null;
}

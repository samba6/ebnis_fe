/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

import { Registration } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: UserRegMutation
// ====================================================

export interface UserRegMutation_registration {
  __typename: "User";
  id: string;
  name: string;
  email: string;
  jwt: string;
}

export interface UserRegMutation {
  registration: UserRegMutation_registration | null;
}

export interface UserRegMutationVariables {
  registration: Registration;
}

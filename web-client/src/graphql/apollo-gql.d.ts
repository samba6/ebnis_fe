

/* tslint:disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: ExperienceMutation
// ====================================================

export interface ExperienceMutation_experience_fields {
  id: string;
  name: string;                   // Name of field e.g start, end, meal
  singleLineText: string | null;  // A single line text field
  multiLineText: string | null;   // A multi line text field
  integer: number | null;         // An integer field type
  decimal: number | null;         // A floating point number field type
  date: any | null;               // Date field type
  datetime: any | null;           // Datetime field type
}

export interface ExperienceMutation_experience {
  id: string;
  title: string;
  fields: (ExperienceMutation_experience_fields | null)[];
}

export interface ExperienceMutation {
  experience: ExperienceMutation_experience | null;
}

export interface ExperienceMutationVariables {
  experience: CreateExperience;
}


/* tslint:disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: LoginMutation
// ====================================================

export interface LoginMutation_login {
  id: string;
  name: string;
  email: string;
  jwt: string;
}

export interface LoginMutation {
  login: LoginMutation_login | null;
}

export interface LoginMutationVariables {
  login: LoginUser;
}


/* tslint:disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UserRegMutation
// ====================================================

export interface UserRegMutation_registration {
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


/* tslint:disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL fragment: ExpFieldFragment
// ====================================================

export interface ExpFieldFragment {
  id: string;
  name: string;                   // Name of field e.g start, end, meal
  singleLineText: string | null;  // A single line text field
  multiLineText: string | null;   // A multi line text field
  integer: number | null;         // An integer field type
  decimal: number | null;         // A floating point number field type
  date: any | null;               // Date field type
  datetime: any | null;           // Datetime field type
}


/* tslint:disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL fragment: ExperienceFragment
// ====================================================

export interface ExperienceFragment {
  id: string;
  title: string;
}


/* tslint:disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL fragment: UserFragment
// ====================================================

export interface UserFragment {
  id: string;
  name: string;
  email: string;
  jwt: string;
}

/* tslint:disable */
// This file was automatically generated and should not be edited.

//==============================================================
// START Enums and Input Objects
//==============================================================

// Variables for creating Experience
export interface CreateExperience {
  fields: (CreateExpField | null)[];
  title: string;
  userId: string;
}

// Variables for creating field for an existing experience
export interface CreateExpField {
  date?: any | null;
  datetime?: any | null;
  decimal?: number | null;
  integer?: number | null;
  multiLineText?: string | null;
  name: string;
  singleLineText?: string | null;
}

// Variables for login in User
export interface LoginUser {
  email: string;
  password: string;
}

// Variables for creating User and credential
export interface Registration {
  email: string;
  name: string;
  password: string;
  passwordConfirmation: string;
  source: string;
}

//==============================================================
// END Enums and Input Objects
//==============================================================
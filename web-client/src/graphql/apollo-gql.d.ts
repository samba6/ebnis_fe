

/* tslint:disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: ExpDefMutation
// ====================================================

export interface ExpDefMutation_expDef {
  id: string;
}

export interface ExpDefMutation {
  expDef: ExpDefMutation_expDef | null;
}

export interface ExpDefMutationVariables {
  expDef: CreateExpDef;
}


/* tslint:disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetAnExpDef
// ====================================================

export interface GetAnExpDef_expDef_fieldDefs {
  id: string;
  name: string;     // Name of field e.g start, end, meal
  type: FieldType;  // The data type of the field
}

export interface GetAnExpDef_expDef {
  id: string;
  title: string;
  description: string | null;
  fieldDefs: (GetAnExpDef_expDef_fieldDefs | null)[];
}

export interface GetAnExpDef {
  expDef: GetAnExpDef_expDef | null;  // get an experience
}

export interface GetAnExpDefVariables {
  expDef: GetExpDef;
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
// GraphQL fragment: ExpDefFragment
// ====================================================

export interface ExpDefFragment {
  id: string;
  title: string;
  description: string | null;
}


/* tslint:disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL fragment: FieldDefFragment
// ====================================================

export interface FieldDefFragment {
  id: string;
  name: string;     // Name of field e.g start, end, meal
  type: FieldType;  // The data type of the field
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

export enum FieldType {
  DATE = "DATE",
  DATETIME = "DATETIME",
  DECIMAL = "DECIMAL",
  INTEGER = "INTEGER",
  MULTI_LINE_TEXT = "MULTI_LINE_TEXT",
  SINGLE_LINE_TEXT = "SINGLE_LINE_TEXT",
}

// Variables for creating Experience
export interface CreateExpDef {
  description?: string | null;
  fieldDefs: (CreateFieldDef | null)[];
  title: string;
}

// Variables for creating field for an existing experience
export interface CreateFieldDef {
  name: string;
  type: FieldType;
}

// Variables for getting an experience
export interface GetExpDef {
  id: string;
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
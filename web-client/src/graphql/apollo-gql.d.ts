

/* tslint:disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: CreateExpMutation
// ====================================================

export interface CreateExpMutation_exp {
  id: string;
  title: string;
  description: string | null;
}

export interface CreateExpMutation {
  exp: CreateExpMutation_exp | null;
}

export interface CreateExpMutationVariables {
  exp: CreateExp;
}


/* tslint:disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetExps
// ====================================================

export interface GetExps_exps {
  id: string;
  title: string;
  description: string | null;
}

export interface GetExps {
  exps: (GetExps_exps | null)[] | null;  // get all experiences belonging to a user
}


/* tslint:disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetAnExp
// ====================================================

export interface GetAnExp_exp_fieldDefs {
  id: string;
  name: string;     // Name of field e.g start, end, meal
  type: FieldType;  // The data type of the field
}

export interface GetAnExp_exp {
  id: string;
  title: string;
  description: string | null;
  fieldDefs: (GetAnExp_exp_fieldDefs | null)[];  // The field definitions used for the experience entries
}

export interface GetAnExp {
  exp: GetAnExp_exp | null;  // get an experience
}

export interface GetAnExpVariables {
  exp: GetExp;
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
// GraphQL fragment: ExpFrag
// ====================================================

export interface ExpFrag {
  id: string;
  title: string;
  description: string | null;
}


/* tslint:disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL fragment: FieldDefFrag
// ====================================================

export interface FieldDefFrag {
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
export interface CreateExp {
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
export interface GetExp {
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
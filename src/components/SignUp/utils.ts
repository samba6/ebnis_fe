import * as Yup from "yup";
import { RouteComponentProps } from "@reach/router";
import { WithApolloClient } from "react-apollo";
import { FormikErrors } from "formik";
import { ApolloError } from "apollo-client";
import { Reducer, Dispatch } from "react";

import { RegMutationProps } from "../../graphql/user-reg.mutation";
import { Registration } from "../../graphql/apollo-types/globalTypes";
import { PwdInputActionTypes } from "../PwdInput/pwd-input";
import { UserLocalMutationProps } from "../../state/user.resolver";

export interface Props
  extends RouteComponentProps,
    RegMutationProps,
    UserLocalMutationProps,
    WithApolloClient<{}> {}

export type FormValuesKey = keyof Registration;

export const initialFormValues: Registration = {
  name: "",
  email: "",
  password: "",
  passwordConfirmation: "",
  source: "password",
};

export const ValidationSchema = Yup.object<Registration>().shape({
  name: Yup.string()
    .min(2, "must be at least 2 characters")
    .max(50, "is too long!")
    .required("is required"),
  email: Yup.string()
    .email("is invalid")
    .required("is required"),
  password: Yup.string()
    .min(4, "must be at least 4 characters")
    .max(50, "is too Long!")
    .required("is required"),
  passwordConfirmation: Yup.string()
    .required("is required")
    .test("passwords-match", "passwords do not match", function(val) {
      return this.parent.password === val;
    }),
  source: Yup.string().default("password"),
});

export const RouterThings = {
  documentTitle: "Sign up",
};

export const FORM_RENDER_PROPS = {
  name: ["Name", "text"],
  email: ["Email", "email"],
  password: ["Password", "password"],
  passwordConfirmation: ["Password Confirm", "password"],
  source: ["Source", "text"],
};

export enum ActionTypes {
  set_other_errors = "@components/signup/set_other_errors",
  set_form_errors = "@components/signup/set_form_errors",
  set_server_errors = "@components/signup/set_server_errors",
  clear_all_errors = "@components/signup/clear_all_errors",
  clear_error_summary = "@components/signup/clear_error_summary",
}

export type FormErrors = FormikErrors<Registration>;
type ServerFieldsErrors = { [k in keyof Registration]: string };
export type FormFieldErrors = Pick<State, "formErrors" | "serverFieldsErrors">;

export type ErrorSummary = Pick<
  State,
  | "formErrors"
  | "networkError"
  | "otherErrors"
  | "showingErrorSummary"
  | "serverFieldsErrors"
>;
export interface State {
  readonly serverFieldsErrors?: ServerFieldsErrors | null;
  readonly formErrors?: FormErrors | null;
  readonly pwdType?: "password" | "text";
  readonly otherErrors?: string | null;
  readonly networkError?: string | null;
  readonly showingErrorSummary?: boolean;
}

export const initialState = {} as State;

type ActionPayload =
  | null
  | undefined
  | FormErrors
  | ApolloError
  | string
  | boolean;

export interface Action {
  type: ActionTypes | PwdInputActionTypes;
  payload?: ActionPayload;
}

/**
 * form-errors and server-field-errors should be at bottom of field and not in summary
 *
 * other errors and network errors should be in summary
 *
 *
 */

const reducerObject: {
  [k in ActionTypes]: (prevState: State, payload: ActionPayload) => State;
} = {
  [ActionTypes.clear_all_errors]: prevState => ({
    ...prevState,
    serverFieldsErrors: null,
    formErrors: null,
    networkError: null,
    otherErrors: null,
    showingErrorSummary: false,
  }),

  [ActionTypes.set_form_errors]: (prevState, payload) => ({
    ...prevState,
    formErrors: payload as FormErrors,
    showingErrorSummary: true,
  }),

  [ActionTypes.clear_error_summary]: prevState => ({
    ...prevState,
    networkError: null,
    otherErrors: null,
    showingErrorSummary: false,
  }),

  [ActionTypes.set_server_errors]: (prevState, payload) => {
    const { networkError, graphQLErrors } = payload as ApolloError;
    let errors = null;

    if (graphQLErrors && graphQLErrors[0]) {
      errors = JSON.parse(graphQLErrors[0].message).errors;
    }

    return {
      ...prevState,
      networkError: networkError && networkError.message,
      serverFieldsErrors: errors,
      showingErrorSummary: true,
    };
  },

  [ActionTypes.set_other_errors]: (prevState, payload) => ({
    ...prevState,
    otherErrors: payload as string,
    showingErrorSummary: true,
  }),
};

export const reducer: Reducer<State, Action> = (
  prevState,
  { type, payload },
) => {
  const fn = reducerObject[type];

  if (fn) {
    return fn(prevState, payload);
  }

  // istanbul ignore next
  return prevState;
};

export type DispatchType = Dispatch<Action>;

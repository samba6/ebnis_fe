import * as Yup from "yup";
import { RouteComponentProps } from "@reach/router";
import { WithApolloClient } from "react-apollo";
import { FormikErrors } from "formik";
import { ApolloError } from "apollo-client";
import { Reducer, Dispatch } from "react";
import immer from "immer";
import { RegMutationProps } from "../../graphql/user-reg.mutation";
import { Registration } from "../../graphql/apollo-types/globalTypes";
import { PasswordInputAction, PasswordInputType } from "../PwdInput/pwd-input";
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

export enum ActionType {
  setOtherErrors = "@components/signup/set_other_errors",
  setFormErrors = "@components/signup/set_form_errors",
  setServerErrors = "@components/signup/set_server_errors",
  clearAllErrors = "@components/signup/clear_all_errors",
  clearErrorSummary = "@components/signup/clear_error_summary",
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

type Action =
  | [ActionType.setOtherErrors, string]
  | [ActionType.setFormErrors, FormErrors]
  | [ActionType.setServerErrors, ApolloError]
  | [ActionType.clearAllErrors]
  | [ActionType.clearErrorSummary]
  | PasswordInputAction;

/**
 * form-errors and server-field-errors should be at bottom of field and not in summary
 *
 * other errors and network errors should be in summary
 *
 *
 */
export const reducer: Reducer<State, Action> = (prevState, [type, payload]) => {
  return immer(prevState, proxy => {
    switch (type) {
      case ActionType.clearAllErrors:
        {
          proxy.serverFieldsErrors = null;
          proxy.formErrors = null;
          proxy.networkError = null;
          proxy.otherErrors = null;
          proxy.showingErrorSummary = false;
        }

        break;

      case ActionType.setFormErrors:
        {
          proxy.formErrors = payload as FormErrors;
          proxy.showingErrorSummary = true;
        }

        break;

      case ActionType.clearErrorSummary:
        {
          proxy.networkError = null;
          proxy.otherErrors = null;
          proxy.showingErrorSummary = false;
        }

        break;

      case ActionType.setServerErrors:
        {
          const { networkError, graphQLErrors } = payload as ApolloError;
          let errors = null;

          if (graphQLErrors && graphQLErrors[0]) {
            errors = JSON.parse(graphQLErrors[0].message).errors;
          }

          (proxy.networkError = networkError && networkError.message),
            (proxy.serverFieldsErrors = errors),
            (proxy.showingErrorSummary = true);
        }

        break;

      case ActionType.setOtherErrors:
        {
          (proxy.otherErrors = payload as string),
            (proxy.showingErrorSummary = true);
        }

        break;

      // istanbul ignore next: test covered in Password Component
      case PasswordInputType:
        {
          proxy.pwdType = payload as "password" | "text";
        }

        break;
    }
  });
};

export type DispatchType = Dispatch<Action>;

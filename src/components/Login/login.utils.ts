import * as Yup from "yup";
import { RouteComponentProps } from "@reach/router";
import { Reducer } from "react";
import { FormikErrors } from "formik";
import { ApolloError } from "apollo-client";
import immer from "immer";
import { LoginUser as FormValues } from "../../graphql/apollo-types/globalTypes";
import {
  PasswordInputAction,
  PasswordInputType,
} from "../PasswordInput/password-input.utils";
import { wrapReducer } from "../../logger";

export const ValidationSchema = Yup.object<FormValues>().shape({
  email: Yup.string()
    .email("must be valid email address")
    .required(),
  password: Yup.string()
    .required()
    .min(4, "too short"),
});

export const RouterThings = {
  documentTitle: "Log in",
};

export enum ActionType {
  OTHER_ERRORS = "@/login/set_other_errors",
  FORM_ERRORS = "@/login/set_form_error",
  SERVER_ERRORS = "@/login/set_server_errors",
  CLEAR_ALL_ERRORS = "@/login/clear_all_errors",
  SHOW_PAGE = "@/login/showPage",
}

export const initialState = {} as IStateMachine;

export const reducer: Reducer<IStateMachine, Action> = (state, action) =>
  wrapReducer(state, action, (prevState, [type, payload]) => {
    return immer(prevState, proxy => {
      switch (type) {
        case ActionType.OTHER_ERRORS:
          {
            proxy.otherErrors = payload as string;
          }

          break;

        case ActionType.FORM_ERRORS:
          {
            proxy.formErrors = payload as FormikErrors<FormValues>;
          }

          break;

        case ActionType.SERVER_ERRORS:
          {
            const { graphQLErrors, networkError } = payload as ApolloError;

            let error = null;

            if (graphQLErrors && graphQLErrors[0]) {
              error = JSON.parse(graphQLErrors[0].message).error;
            }

            proxy.serverFieldErrors = error;
            proxy.networkError = networkError ? networkError.message : null;
          }

          break;

        case ActionType.CLEAR_ALL_ERRORS:
          {
            proxy.otherErrors = null;
            proxy.serverFieldErrors = null;
            proxy.formErrors = null;
            proxy.networkError = null;
          }

          break;

        // istanbul ignore next: test covered in Password Component
        case PasswordInputType:
          {
            proxy.pwdType = payload as "password" | "text";
          }

          break;

        case ActionType.SHOW_PAGE:
          {
            proxy.showPage = payload as boolean;
          }

          break;
      }
    });
  });

////////////////////////// TYPES ////////////////////////////

export type Action =
  | [ActionType.CLEAR_ALL_ERRORS]
  | [ActionType.OTHER_ERRORS, string]
  | [ActionType.FORM_ERRORS, FormikErrors<FormValues>]
  | [ActionType.SERVER_ERRORS, string]
  | PasswordInputAction
  | [ActionType.SHOW_PAGE, boolean];

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Props extends RouteComponentProps<{}> {}

export interface IStateMachine {
  readonly otherErrors?: string | null;
  readonly formErrors?: FormikErrors<FormValues> | null;
  readonly serverFieldErrors?: string | null;
  readonly pwdType?: "password" | "text";
  readonly networkError?: string | null;
  readonly showPage?: boolean;
}

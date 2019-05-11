import * as Yup from "yup";
import { RouteComponentProps } from "@reach/router";
import { Reducer, ComponentType } from "react";
import { FormikErrors, FormikActions } from "formik";
import { ApolloError } from "apollo-client";
import { Dispatch } from "react";
import { WithApolloClient } from "react-apollo";

import { LoginUser as FormValues } from "../../graphql/apollo-types/globalTypes";
import { LoginMutationProps } from "../../graphql/login.mutation";
import { UserLocalMutationProps } from "../../state/user.local.mutation";
import { LoggedOutUserProps } from "../../state/logged-out-user.local.query";
import { PwdInputActionTypes } from "../PwdInput/pwd-input";
import { ToOtherAuthLinkProps } from "../ToOtherAuthLink";

export interface OwnProps
  extends RouteComponentProps<{}>,
    WithApolloClient<{}> {
  ToOtherAuthLink: ComponentType<ToOtherAuthLinkProps>;
}

export type Props = OwnProps &
  LoginMutationProps &
  UserLocalMutationProps &
  LoggedOutUserProps;

export const ValidationSchema = Yup.object<FormValues>().shape({
  email: Yup.string()
    .email("Must be valid email address")
    .required(),
  password: Yup.string()
    .required()
    .min(4, "Too short")
});

export const RouterThings = {
  documentTitle: "Log in"
};

export enum Action_Types {
  SET_OTHER_ERRORS = "@components/login/SET_OTHER_ERRORS",
  SET_FORM_ERROR = "@components/login/SET_FORM_ERROR",
  SET_GRAPHQL_ERROR = "@components/login/SET_GRAPHQL_ERROR",
  CLEAR_ALL_ERRORS = "@components/login/CLEAR_ALL_ERRORS"
}

export interface State {
  readonly otherErrors?: string;
  readonly formErrors?: FormikErrors<FormValues>;
  readonly graphQlErrors?: ApolloError;
  readonly pwdType?: "password" | "text";
}

export const initialState: State = {
  otherErrors: undefined,
  formErrors: undefined,
  graphQlErrors: undefined
};

export interface Action {
  type: Action_Types | PwdInputActionTypes;
  payload:
    | null
    | undefined
    | boolean
    | FormikErrors<FormValues>
    | ApolloError
    | string;
}

export const authFormErrorReducer: Reducer<State, Action> = (state, action) => {
  switch (action.type) {
    case Action_Types.SET_OTHER_ERRORS:
      return { ...state, otherErrors: action.payload as string };

    case Action_Types.SET_FORM_ERROR:
      return {
        ...state,
        formErrors: action.payload as FormikErrors<FormValues>
      };

    case Action_Types.SET_GRAPHQL_ERROR:
      return { ...state, graphQlErrors: action.payload as ApolloError };

    // istanbul ignore next: The password component owns this
    case PwdInputActionTypes.SET_PWD_TYPE:
      return { ...state, pwdType: action.payload as "password" | "text" };

    case Action_Types.CLEAR_ALL_ERRORS:
      return {
        ...state,
        otherErrors: undefined,
        graphQlErrors: undefined,
        formErrors: undefined
      };

    // istanbul ignore next: React.dispatch to the rescue
    default:
      return state;
  }
};

export interface SubmitArg extends LoginMutationProps, UserLocalMutationProps {
  values: FormValues;
  formikBag: FormikActions<FormValues>;
  dispatch: Dispatch<Action>;
}

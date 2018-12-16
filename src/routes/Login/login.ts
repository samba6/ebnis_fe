import * as Yup from "yup";
import { RouteComponentProps } from "react-router-dom";
import { Reducer } from "react";
import { FormikErrors, FormikActions } from "formik";
import { ApolloError, ApolloClient } from "apollo-client";
import { Dispatch } from "react";

import { LoginUser as FormValues } from "../../graphql/apollo-gql.d";
import { LoginMutationProps } from "../../graphql/login.mutation";
import { UserLocalMutationProps } from "../../state/user.local.mutation";
import { LoggedOutUserProps } from "../../state/logged-out-user.local.query";
import { ConnProps } from "../../state/conn.query";
import { PwdInputActionTypes } from "../../components/PwdInput/pwd-input";

export interface OwnProps extends RouteComponentProps<{}> {
  refreshToHome?: () => void;
  getConnStatus?: (client: ApolloClient<{}>) => Promise<boolean>;
}

export type Props = OwnProps &
  LoginMutationProps &
  UserLocalMutationProps &
  LoggedOutUserProps &
  ConnProps;

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
  SET_OTHER_ERRORS = "@login/SET_OTHER_ERRORS",
  SET_FORM_ERROR = "@login/SET_FORM_ERROR",
  SET_GRAPHQL_ERROR = "@login/SET_GRAPHQL_ERROR"
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

    case PwdInputActionTypes.SET_PWD_TYPE:
      return { ...state, pwdType: action.payload as "password" | "text" };

    default:
      return state;
  }
};

export interface SubmitArg extends LoginMutationProps, UserLocalMutationProps {
  values: FormValues;
  formikBag: FormikActions<FormValues>;
  dispatch: Dispatch<Action>;
  refreshToHome: () => void;
}

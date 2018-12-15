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
}

export interface Action {
  type: Action_Types;
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
      const payload1 = action.payload as string;
      return { ...state, otherErrors: payload1 };

    case Action_Types.SET_FORM_ERROR:
      const payload2 = action.payload as FormikErrors<FormValues>;
      return { ...state, formErrors: payload2 };

    case Action_Types.SET_GRAPHQL_ERROR:
      const payload3 = action.payload as ApolloError;
      return { ...state, graphQlErrors: payload3 };

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

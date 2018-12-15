import * as Yup from "yup";
import { WithApolloClient } from "react-apollo";
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

export interface OwnProps
  extends WithApolloClient<{}>,
    RouteComponentProps<{}> {
  submit?: (args: SubmitArg) => Promise<void>;
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
  SET_CONN_ERROR = "@login/SET_CONN_ERROR",
  SET_FORM_ERROR = "@login/SET_FORM_ERROR",
  SET_GRAPHQL_ERROR = "@login/SET_GRAPHQL_ERROR"
}

export interface State {
  readonly connError?: boolean;
  readonly formErrors?: FormikErrors<FormValues>;
  readonly graphQlErrors?: ApolloError;
}

export interface Action {
  type: Action_Types;
  payload: undefined | boolean | FormikErrors<FormValues> | ApolloError;
}

export const loginReducer: Reducer<State, Action> = (state, action) => {
  switch (action.type) {
    case Action_Types.SET_CONN_ERROR:
      const payload1 = action.payload as boolean;
      return { ...state, connError: payload1 };

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
  client: ApolloClient<{}>;
  getConnStatus?: (client: ApolloClient<{}>) => Promise<boolean>;
  refreshToHome?: () => void;
}

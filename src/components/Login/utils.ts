import * as Yup from "yup";
import { RouteComponentProps } from "@reach/router";
import { Reducer } from "react";
import { FormikErrors } from "formik";
import { ApolloError } from "apollo-client";
import { WithApolloClient } from "react-apollo";

import { LoginUser as FormValues } from "../../graphql/apollo-types/globalTypes";
import { LoginMutationProps } from "../../graphql/login.mutation";
import { PwdInputActionTypes } from "../PwdInput/pwd-input";
import {
  UserLocalMutationProps,
  UserLocalGqlProps,
} from "../../state/user.resolver";

export interface OwnProps
  extends RouteComponentProps<{}>,
    WithApolloClient<{}> {}

export type Props = OwnProps &
  LoginMutationProps &
  UserLocalMutationProps &
  UserLocalGqlProps;

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

export enum ActionTypes {
  set_other_errors = "@components/login/set_other_errors",
  set_form_error = "@components/login/set_form_error",
  set_server_errors = "@components/login/set_server_errors",
  clear_all_errors = "@components/login/clear_all_errors",
}

export interface State {
  readonly otherErrors?: string | null;
  readonly formErrors?: FormikErrors<FormValues> | null;
  readonly serverFieldErrors?: string | null;
  readonly pwdType?: "password" | "text";
  readonly networkError?: string | null;
}

export const initialState = {} as State;

type Payload =
  | null
  | undefined
  | boolean
  | FormikErrors<FormValues>
  | ApolloError
  | string;

type ActionSuperType = ActionTypes | PwdInputActionTypes;

export interface Action {
  type: ActionSuperType;
  payload?: Payload;
}

const reducerFunctionsObject: {
  [k in ActionSuperType]: (state: State, payload: Payload) => State;
} = {
  [ActionTypes.set_other_errors]: (prevState, payload) => ({
    ...prevState,
    otherErrors: payload as string,
  }),

  [ActionTypes.set_form_error]: (prevState, payload) => ({
    ...prevState,
    formErrors: payload as FormikErrors<FormValues>,
  }),

  [ActionTypes.set_server_errors]: (prevState, payload) => {
    const { graphQLErrors, networkError } = payload as ApolloError;

    let error = null;

    if (graphQLErrors && graphQLErrors[0]) {
      error = JSON.parse(graphQLErrors[0].message).error;
    }

    return {
      ...prevState,
      serverFieldErrors: error,
      networkError: networkError ? networkError.message : null,
    };
  },

  // istanbul ignore next: covered in password input.
  [PwdInputActionTypes.SET_PWD_TYPE]: (prevState, payload) => {
    // istanbul ignore next: covered in password input.
    return {
      ...prevState,
      pwdType: payload as "password" | "text",
    };
  },

  [ActionTypes.clear_all_errors]: prevState => ({
    ...prevState,
    otherErrors: null,
    serverFieldErrors: null,
    formErrors: null,
    networkError: null,
  }),
};

export const reducer: Reducer<State, Action> = (
  prevState,
  { type, payload },
) => {
  const fn = reducerFunctionsObject[type];

  if (fn) {
    return fn(prevState, payload as Payload);
  }

  // istanbul ignore next: React.dispatch to the rescue
  return prevState;
};

import { FormikActions } from "formik";
import { Dispatch } from "react";
import { ApolloClient } from "apollo-client";

import refreshToHome from "../../Routing/refresh-to-home";
import { LoginUser as FormValues } from "../../graphql/apollo-gql.d";
import { Action_Types, Action } from "./login";
import { LoginMutationProps } from "../../graphql/login.mutation";
import { UserLocalMutationProps } from "../../state/user.local.mutation";
import getConnStatus from "../../state/get-conn-status";

interface SubmitArg extends LoginMutationProps, UserLocalMutationProps {
  values: FormValues;
  formikBag: FormikActions<FormValues>;
  dispatch: Dispatch<Action>;
  client: ApolloClient<{}>;
}

export default async function submit({
  values,
  formikBag,
  dispatch,
  login,
  updateLocalUser,
  client
}: SubmitArg) {
  formikBag.setSubmitting(true);
  const connStatus = await getConnStatus(client);

  if (!connStatus) {
    formikBag.setSubmitting(false);
    dispatch({ type: Action_Types.SET_CONN_ERROR, payload: true });
    return;
  }

  const errors = await formikBag.validateForm(values);

  if (errors.email || errors.password) {
    formikBag.setSubmitting(false);
    dispatch({
      type: Action_Types.SET_FORM_ERROR,
      payload: errors
    });
    return;
  }

  if (!login) {
    return;
  }

  try {
    const result = await login({
      variables: {
        login: values
      }
    });

    if (result && result.data) {
      const user = result.data.login;

      await updateLocalUser({
        variables: { user }
      });

      refreshToHome();
    }
  } catch (error) {
    formikBag.setSubmitting(false);
    dispatch({ type: Action_Types.SET_GRAPHQL_ERROR, payload: error });
  }
}

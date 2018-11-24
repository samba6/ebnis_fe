import { AppContextProps } from "../../containers/App/app";
import * as Yup from "yup";
import { WithApolloClient } from "react-apollo";

import { LoginUser as FormValues } from "../../graphql/apollo-gql";
import { LoginQueryProps } from "../../graphql/login.query";
import { UserLocalMutationProps } from "../../state/user.local.mutation";
import { LoggedOutUserProps } from "../../state/logged-out-user.local.query";
import { ApolloError } from "apollo-client";
import { FormikErrors } from "formik";

export type OwnProps = WithApolloClient<{}> & AppContextProps;

export type Props = OwnProps &
  LoginQueryProps &
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

export interface State {
  graphQlErrors?: ApolloError;
  formErrors?: FormikErrors<FormValues>;
}

export const RouterThings = {
  documentTitle: "Log in"
};

import { AppRouteProps } from "../../containers/App/app";
import * as Yup from "yup";
import { WithApolloClient } from "react-apollo";
import { RouteComponentProps } from "react-router-dom";

import { LoginUser as FormValues } from "../../graphql/apollo-gql";
import { LoginMutationProps } from "../../graphql/login.mutation";
import { UserLocalMutationProps } from "../../state/user.local.mutation";
import { LoggedOutUserProps } from "../../state/logged-out-user.local.query";

export type OwnProps = WithApolloClient<{}> &
  AppRouteProps &
  RouteComponentProps<{}>;

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

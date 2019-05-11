import * as Yup from "yup";
import { RouteComponentProps } from "@reach/router";
import { WithApolloClient } from "react-apollo";
import { ComponentType } from "react";

import { RegMutationProps } from "../../graphql/user-reg.mutation";
import { UserLocalMutationProps } from "../../state/user.local.mutation";
import { Registration } from "../../graphql/apollo-types/globalTypes";
import { ToOtherAuthLinkProps } from "../ToOtherAuthLink";

export interface Props
  extends RouteComponentProps,
    RegMutationProps,
    UserLocalMutationProps,
    WithApolloClient<{}> {
  ToOtherAuthLink: ComponentType<ToOtherAuthLinkProps>;
}

export type FormValuesKey = keyof Registration;

export const initialFormValues: Registration = {
  name: "",
  email: "",
  password: "",
  passwordConfirmation: "",
  source: "password"
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
    .test("passwords-match", "Passwords do not match", function(val) {
      return this.parent.password === val;
    }),
  source: Yup.string().default("password")
});

export const RouterThings = {
  documentTitle: "Sign up"
};

export const FORM_RENDER_PROPS = {
  name: ["Name", "text"],
  email: ["Email", "email"],
  password: ["Password", "password"],
  passwordConfirmation: ["Password Confirm", "password"],
  source: ["Source", "text"]
};

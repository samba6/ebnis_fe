import * as Yup from "yup";
import { RouteComponentProps } from "react-router-dom";
import { FormikActions } from "formik";
import { Dispatch } from "react";

import { RegMutationProps } from "../../graphql/user-reg.mutation";
import { UserLocalMutationProps } from "../../state/user.local.mutation";
import { Registration } from "../../graphql/apollo-gql.d";
import { ConnProps } from "../../state/conn.query";
import { Action } from "../Login/login";

export interface Props
  extends RouteComponentProps,
    RegMutationProps,
    UserLocalMutationProps,
    ConnProps {
  refreshToHome?: () => void;
  scrollToTop?: () => void;
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
    .min(2, "Too Short!")
    .max(50, "Too Long!")
    .required("Required"),
  email: Yup.string()
    .email("Invalid email")
    .required("Required"),
  password: Yup.string()
    .min(4, "Too Short!")
    .max(50, "Too Long!")
    .required("Required"),
  passwordConfirmation: Yup.string()
    .required("Required")
    .test("password", "Passwords do not match", function(val) {
      return this.parent.password === val;
    }),
  source: Yup.string().default(() => "password")
});

export const RouterThings = {
  documentTitle: "Sign up"
};

export interface SubmitArg extends RegMutationProps, UserLocalMutationProps {
  values: Registration;
  formikBag: FormikActions<Registration>;
  dispatch: Dispatch<Action>;
  refreshToHome: () => void;
  scrollToTop: () => void;
}

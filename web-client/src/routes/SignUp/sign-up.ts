import { ApolloError } from "apollo-client";
import * as Yup from "yup";
import { FormikErrors } from "formik";

import { AppContextProps } from "../../containers/App/app";
import { RegMutationProps } from "../../graphql/user-reg.mutation";
import { UserLocalMutationProps } from "../../state/user.local.mutation";
import { Registration } from "../../graphql/apollo-gql";

export type Props = AppContextProps & RegMutationProps & UserLocalMutationProps;

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

export interface State {
  graphQlError?: ApolloError;
  formErrors?: FormikErrors<Registration>;
}

export const RouterThings = {
  documentTitle: "Sign up"
};

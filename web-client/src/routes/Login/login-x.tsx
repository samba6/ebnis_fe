import React, { useState, useEffect } from "react";
import { Button, Card, Input, Message, Icon, Form } from "semantic-ui-react";
import {
  Formik,
  FastField,
  FieldProps,
  FormikProps,
  FormikActions,
  FormikErrors,
  Field
} from "formik";
import { ApolloError } from "apollo-client";

import "./login.scss";
import { Props, ValidationSchema } from "./login";
import SidebarHeader from "../../components/SidebarHeader";
import { LoginUser as FormValues } from "../../graphql/apollo-gql.d";
import { setTitle, SIGN_UP_URL } from "../../Routing";
import refreshToHome from "./refresh-to-home";

export const Login = (props: Props) => {
  const [pwdType, setPwdType] = useState("password");

  const [formErrors, setFormErrors] = useState<
    FormikErrors<FormValues> | undefined
  >(undefined);

  const [graphQlErrors, setGraphQlErrors] = useState<ApolloError | undefined>(
    undefined
  );

  useEffect(function setPageTitle() {
    setTitle("Log in");

    return setTitle;
  }, []);

  function renderForm({
    dirty,
    isSubmitting,
    values,
    ...formikProps
  }: FormikProps<FormValues>) {
    const { history } = props;

    return (
      <Card>
        {renderSubmissionErrors()}

        <Card.Content>
          <Form onSubmit={() => submit(values, formikProps)}>
            <FastField name="email" render={renderEmailInput} />

            <Field name="password" render={renderPwdInput} />

            <Button
              id="login-submit"
              name="login-submit"
              color="green"
              inverted={true}
              disabled={!dirty || isSubmitting}
              loading={isSubmitting}
              type="submit"
              fluid={true}
            >
              <Icon name="checkmark" /> Ok
            </Button>
          </Form>
        </Card.Content>

        <Card.Content extra={true}>
          <Button
            className="to-sign-up-button"
            type="button"
            fluid={true}
            onClick={() => history.replace(SIGN_UP_URL)}
            disabled={isSubmitting}
            name="to-sign-up"
          >
            Don't have an account? Sign Up
          </Button>
        </Card.Content>
      </Card>
    );
  }

  const submit = async (
    values: FormValues,
    formikBag: FormikActions<FormValues>
  ) => {
    setFormErrors(undefined);
    setGraphQlErrors(undefined);

    const errors = await formikBag.validateForm(values);

    formikBag.setSubmitting(true);

    if (errors.email || errors.password) {
      formikBag.setSubmitting(false);
      setFormErrors(errors);

      return;
    }

    const { login } = props;

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

        await props.updateLocalUser({
          variables: { user }
        });

        refreshToHome();
      }
    } catch (error) {
      formikBag.setSubmitting(false);
      setGraphQlErrors(error);
    }
  };

  function renderEmailInput(formProps: FieldProps<FormValues>) {
    const { field } = formProps;

    return (
      <Form.Field>
        <label htmlFor="email">Email</label>
        <Input
          {...field}
          type="email"
          autoComplete="off"
          autoFocus={true}
          id="email"
        />
      </Form.Field>
    );
  }

  function renderPwdInput(formProps: FieldProps<FormValues>) {
    const { field } = formProps;

    return (
      <Form.Field>
        <label htmlFor="password">Password</label>
        <Input icon placeholder="">
          <input {...field} type={pwdType} autoComplete="off" id="password" />

          {pwdType === "password" && field.value && (
            <Icon name="eye" className="link" onClick={toggleShowPwdClicked} />
          )}

          {pwdType === "text" && field.value && (
            <Icon
              name="eye slash"
              className="link"
              onClick={toggleShowPwdClicked}
            />
          )}
        </Input>
      </Form.Field>
    );
  }

  function toggleShowPwdClicked() {
    setPwdType(pwdType === "password" ? "text" : "password");
  }

  function renderSubmissionErrors() {
    if (formErrors) {
      const { email, password } = formErrors;

      if (!(email || password)) {
        return undefined;
      }

      return (
        <Card.Content extra={true}>
          <Message error={true} onDismiss={handleFormErrorDismissed}>
            <Message.Content>
              <span>Errors in fields: </span>

              {email && (
                <div>
                  <span>Email: </span>
                  <span>{email}</span>
                </div>
              )}

              {password && (
                <div>
                  <span>Password: </span>
                  <span>{password}</span>
                </div>
              )}
            </Message.Content>
          </Message>
        </Card.Content>
      );
    }

    if (graphQlErrors) {
      return (
        <Card.Content extra={true}>
          <Message error={true} onDismiss={handleFormErrorDismissed}>
            <Message.Content>{graphQlErrors.message}</Message.Content>
          </Message>
        </Card.Content>
      );
    }

    return undefined;
  }

  function handleFormErrorDismissed() {
    setFormErrors(undefined);
    setGraphQlErrors(undefined);
  }

  return (
    <div className="app-container">
      <SidebarHeader title="Login to your account" wide={true} />

      <div className="app-main routes-login">
        <Formik
          initialValues={{ email: "", password: "" }}
          onSubmit={() => null}
          render={renderForm}
          validationSchema={ValidationSchema}
          validateOnChange={false}
        />
      </div>
    </div>
  );
};

export default Login;

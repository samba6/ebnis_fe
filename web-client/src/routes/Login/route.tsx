import React, { useState, useEffect } from "react";
import { Button, Card, Input, Message, Icon, Form } from "semantic-ui-react";
import {
  Formik,
  FastField,
  FieldProps,
  FormikProps,
  FormikActions,
  FormikErrors
} from "formik";
import { ApolloError } from "apollo-client";

import "./login.scss";
import { Props, ValidationSchema } from "./login";
import Header from "../../components/Header";
import { LoginUser as FormValues } from "../../graphql/apollo-gql";
import socket from "../../socket";
import { setTitle, ROOT_URL, SIGN_UP_URL } from "../../Routing";

export const Login = (props: Props) => {
  const { setHeader } = props;

  const [formErrors, setFormErrors] = useState<
    FormikErrors<FormValues> | undefined
  >(undefined);

  const [graphQlErrors, setGraphQlErrors] = useState<ApolloError | undefined>(
    undefined
  );

  useEffect(() => {
    if (setHeader) {
      setHeader(
        <Header title="Login to your account" wide={true} sideBar={false} />
      );
    }

    setTitle("Log in");
  }, []);

  const renderForm = ({
    dirty,
    isSubmitting,
    values,
    ...formikProps
  }: FormikProps<FormValues>) => {
    const { history } = props;

    return (
      <Card>
        {renderSubmissionErrors()}

        <Card.Content>
          <Form onSubmit={() => submit(values, formikProps)}>
            <FastField name="email" render={renderEmailInput} />

            <FastField name="password" render={renderPwdInput} />

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
  };

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

    const { login, history } = props;

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

        if (user) {
          socket.connect(user.jwt);
        }

        await props.updateLocalUser({
          variables: { user }
        });

        history.replace(ROOT_URL);
      }
    } catch (error) {
      formikBag.setSubmitting(false);
      setGraphQlErrors(error);
    }
  };

  const renderEmailInput = (formProps: FieldProps<FormValues>) => {
    const { field } = formProps;

    return (
      <Form.Field
        {...field}
        control={Input}
        placeholder="Email"
        autoComplete="off"
        label="Email"
        id="email"
        autoFocus={true}
      />
    );
  };

  const renderPwdInput = (formProps: FieldProps<FormValues>) => {
    const { field } = formProps;

    return (
      <Form.Field
        {...field}
        type="password"
        control={Input}
        placeholder="Password"
        autoComplete="off"
        label="Password"
        id="password"
      />
    );
  };

  const renderSubmissionErrors = () => {
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
  };

  const handleFormErrorDismissed = () => setFormErrors(undefined);
  setGraphQlErrors(undefined);

  return (
    <div className="app-main routes-login">
      <Formik
        initialValues={{ email: "", password: "" }}
        onSubmit={() => null}
        render={renderForm}
        validationSchema={ValidationSchema}
        validateOnChange={false}
      />
    </div>
  );
};

export default Login;

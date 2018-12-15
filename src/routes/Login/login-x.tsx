import React, { useState, useEffect, useReducer } from "react";
import { Button, Card, Input, Message, Icon, Form } from "semantic-ui-react";
import { Formik, FastField, FieldProps, FormikProps, Field } from "formik";

import "./login.scss";
import {
  Props,
  ValidationSchema,
  loginReducer,
  Action_Types,
  State
} from "./login";
import SidebarHeader from "../../components/SidebarHeader";
import { LoginUser as FormValues } from "../../graphql/apollo-gql.d";
import { setTitle, SIGN_UP_URL } from "../../Routing";
import submitForm from "./submit";

export const Login = (props: Props) => {
  const { history, client, login, updateLocalUser } = props;
  const [pwdType, setPwdType] = useState("password");
  const [state, dispatch] = useReducer(loginReducer, {} as State);

  useEffect(function setPageTitle() {
    setTitle("Log in");

    return setTitle;
  }, []);

  function renderForm({
    dirty,
    isSubmitting,
    values,
    ...formikBag
  }: FormikProps<FormValues>) {
    return (
      <Card>
        {renderSubmissionErrors()}

        <Card.Content>
          <Form
            onSubmit={function onSubmit() {
              handleFormErrorDismissed();

              submitForm({
                values,
                formikBag,
                login,
                dispatch,
                updateLocalUser,
                client
              });
            }}
          >
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
              <Icon name="checkmark" /> Submit
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
        <Input icon={true} placeholder="" data-testid="password-input">
          <input {...field} type={pwdType} autoComplete="off" id="password" />

          {pwdType === "password" && field.value && (
            <Icon
              name="eye"
              className="link"
              data-testid="password-unmask"
              onClick={toggleShowPwdClicked}
            />
          )}

          {pwdType === "text" && field.value && (
            <Icon
              name="eye slash"
              className="link"
              data-testid="password-mask"
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
    const { connError, formErrors, graphQlErrors } = state;

    if (connError) {
      return (
        <Card.Content extra={true}>
          <Message error={true} onDismiss={handleFormErrorDismissed}>
            <Message.Content>You are not connected</Message.Content>
          </Message>
        </Card.Content>
      );
    }

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
    dispatch({ type: Action_Types.SET_FORM_ERROR, payload: undefined });
    dispatch({ type: Action_Types.SET_GRAPHQL_ERROR, payload: undefined });
    dispatch({ type: Action_Types.SET_CONN_ERROR, payload: false });
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

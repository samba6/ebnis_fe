import React, { useEffect, useReducer } from "react";
import { Button, Card, Input, Message, Icon, Form } from "semantic-ui-react";
import { Formik, FastField, FieldProps, FormikProps, Field } from "formik";

import "./login.scss";
import {
  Props,
  ValidationSchema,
  loginReducer,
  Action_Types,
  State,
  SubmitArg
} from "./login";
import SidebarHeader from "../../components/SidebarHeader";
import { LoginUser as FormValues } from "../../graphql/apollo-gql.d";
import { setTitle, SIGN_UP_URL } from "../../Routing";
import refreshToHomeDefault from "../../Routing/refresh-to-home";
import PwdInput from "../../components/PwdInput";

export function Login(props: Props) {
  const {
    history,
    login,
    updateLocalUser,
    connected,
    refreshToHome = refreshToHomeDefault
  } = props;

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
        <Errors onDismiss={handleErrorsDismissed} errors={state} />

        <Card.Content>
          <Form
            onSubmit={function onSubmit() {
              handleErrorsDismissed();

              if (!(connected && connected.isConnected)) {
                formikBag.setSubmitting(false);
                dispatch({
                  type: Action_Types.SET_OTHER_ERRORS,
                  payload: "You are not connected"
                });
                return;
              }

              submit({
                values,
                formikBag,
                login,
                dispatch,
                updateLocalUser,
                refreshToHome
              });
            }}
          >
            <FastField name="email" component={EmailInput} />

            <Field name="password" component={PwdInput} />

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

  function handleErrorsDismissed() {
    dispatch({ type: Action_Types.SET_FORM_ERROR, payload: undefined });
    dispatch({ type: Action_Types.SET_GRAPHQL_ERROR, payload: undefined });
    dispatch({ type: Action_Types.SET_OTHER_ERRORS, payload: false });
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
}

export default Login;

function EmailInput(props: FieldProps<FormValues>) {
  const { field } = props;

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

interface ErrorsProps {
  errors: State;
  onDismiss: () => void;
}

function Errors(props: ErrorsProps) {
  const {
    errors: { otherErrors, formErrors, graphQlErrors },
    onDismiss
  } = props;

  function messageContent() {
    if (otherErrors) {
      return otherErrors;
    }

    if (formErrors) {
      const { email, password } = formErrors;

      return (
        <>
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
        </>
      );
    }

    if (graphQlErrors) {
      return graphQlErrors.message;
    }

    return null;
  }

  const content = messageContent();

  if (!content) {
    return null;
  }

  return (
    <Card.Content data-testid="login-form-error" extra={true}>
      <Message error={true} onDismiss={onDismiss}>
        <Message.Content>{content}</Message.Content>
      </Message>
    </Card.Content>
  );
}

async function submit({
  values,
  formikBag,
  dispatch,
  login,
  updateLocalUser,
  refreshToHome
}: SubmitArg) {
  if (!login) {
    formikBag.setSubmitting(false);
    dispatch({
      type: Action_Types.SET_OTHER_ERRORS,
      payload: "Unknown error"
    });
    return;
  }

  formikBag.setSubmitting(true);

  const errors = await formikBag.validateForm(values);

  if (errors.email || errors.password) {
    formikBag.setSubmitting(false);
    dispatch({
      type: Action_Types.SET_FORM_ERROR,
      payload: errors
    });
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

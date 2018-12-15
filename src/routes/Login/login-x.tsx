import React, { useEffect, useReducer, Dispatch } from "react";
import { Button, Card, Input, Message, Icon, Form } from "semantic-ui-react";
import { Formik, FastField, FieldProps, FormikProps, Field } from "formik";

import "./login.scss";
import {
  Props,
  ValidationSchema,
  loginReducer,
  Action_Types,
  State,
  SubmitArg,
  Action
} from "./login";
import SidebarHeader from "../../components/SidebarHeader";
import { LoginUser as FormValues } from "../../graphql/apollo-gql.d";
import { setTitle, SIGN_UP_URL } from "../../Routing";
import refreshToHomeDefault from "../../Routing/refresh-to-home";
import getConnStatusDefault from "../../state/get-conn-status";

export function Login(props: Props) {
  const {
    history,
    client,
    login,
    updateLocalUser,
    submit = defaultSubmit
  } = props;

  const [state, dispatch] = useReducer(loginReducer, {
    pwdType: "password"
  } as State);

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
            onSubmit={async function onSubmit() {
              handleErrorsDismissed();

              await submit({
                values,
                formikBag,
                login,
                dispatch,
                updateLocalUser,
                client
              });
            }}
          >
            <FastField name="email" component={EmailInput} />

            <Field
              name="password"
              render={(fieldProps: FieldProps<FormValues>) => (
                <PwdInput
                  dispatch={dispatch}
                  pwdType={state.pwdType}
                  {...fieldProps}
                />
              )}
            />

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
}

export default Login;

interface PwdInputProps extends FieldProps<FormValues> {
  pwdType: "text" | "password";
  dispatch: Dispatch<Action>;
}

function PwdInput(props: PwdInputProps) {
  const { field, pwdType, dispatch } = props;

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
            onClick={() =>
              dispatch({
                type: Action_Types.SET_PASSWORD_TYPE,
                payload: "text"
              })
            }
          />
        )}

        {pwdType === "text" && field.value && (
          <Icon
            name="eye slash"
            className="link"
            data-testid="password-mask"
            onClick={() =>
              dispatch({
                type: Action_Types.SET_PASSWORD_TYPE,
                payload: "password"
              })
            }
          />
        )}
      </Input>
    </Form.Field>
  );
}

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
    errors: { connError, formErrors, graphQlErrors },
    onDismiss
  } = props;

  if (connError) {
    return (
      <Card.Content extra={true}>
        <Message error={true} onDismiss={onDismiss}>
          <Message.Content>You are not connected</Message.Content>
        </Message>
      </Card.Content>
    );
  }

  if (formErrors) {
    const { email, password } = formErrors;

    if (!(email || password)) {
      return null;
    }

    return (
      <Card.Content extra={true}>
        <Message error={true} onDismiss={onDismiss}>
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
        <Message error={true} onDismiss={onDismiss}>
          <Message.Content>{graphQlErrors.message}</Message.Content>
        </Message>
      </Card.Content>
    );
  }

  return null;
}

async function defaultSubmit({
  values,
  formikBag,
  dispatch,
  login,
  updateLocalUser,
  client,
  getConnStatus = getConnStatusDefault,
  refreshToHome = refreshToHomeDefault
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

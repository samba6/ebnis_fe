import React, { useEffect, useReducer, Dispatch } from "react";
import { Button, Card, Input, Message, Icon, Form } from "semantic-ui-react";
import { Formik, FastField, FieldProps, FormikProps, Field } from "formik";

import "./login.scss";
import {
  Props,
  ValidationSchema,
  authFormErrorReducer,
  Action_Types,
  State,
  SubmitArg,
  Action,
  initialState
} from "./login";
import SidebarHeader from "../../components/SidebarHeader";
import { LoginUser as FormValues } from "../../graphql/apollo-gql.d";
import { setTitle, SIGN_UP_URL } from "../../Routing";
import refreshToHomeDefault from "../../Routing/refresh-to-home";
import PwdInput from "../../components/PwdInput";
import getConnDefault from "../../state/get-conn-status";

const Errors = React.memo(ErrorsComp, ErrorsCompEqual);

export function Login(props: Props) {
  const {
    history,
    login,
    updateLocalUser,
    client,
    getConn = getConnDefault,
    refreshToHome = refreshToHomeDefault
  } = props;

  const [state, dispatch] = useReducer(authFormErrorReducer, initialState);

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
        <Errors errors={state} dispatch={dispatch} />

        <Card.Content>
          <Form
            onSubmit={async function onSubmit() {
              handleErrorsDismissed(dispatch);

              if (!(await getConn(client))) {
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

            <Field
              name="password"
              render={(f: FieldProps<FormValues>) => (
                <PwdInput {...f} dispatch={dispatch} pwdType={state.pwdType} />
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

function handleErrorsDismissed(dispatch: Dispatch<Action>) {
  dispatch({ type: Action_Types.SET_FORM_ERROR, payload: undefined });
  dispatch({ type: Action_Types.SET_GRAPHQL_ERROR, payload: undefined });
  dispatch({ type: Action_Types.SET_OTHER_ERRORS, payload: undefined });
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
  dispatch: Dispatch<Action>;
}

function ErrorsCompEqual(
  { errors: p }: ErrorsProps,
  { errors: n }: ErrorsProps
) {
  for (const [k, v] of Object.entries(p)) {
    if (v !== n[k]) {
      return false;
    }
  }

  return true;
}

function ErrorsComp(props: ErrorsProps) {
  const {
    errors: { otherErrors, formErrors, graphQlErrors },
    dispatch
  } = props;

  function onDismiss() {
    handleErrorsDismissed(dispatch);
  }

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

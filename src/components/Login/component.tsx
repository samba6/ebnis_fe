import React, { useReducer, Dispatch } from "react";
import { Button, Card, Input, Message, Icon, Form } from "semantic-ui-react";
import { Formik, FastField, FieldProps, FormikProps, Field } from "formik";
import { WindowLocation } from "@reach/router";

import "./styles.scss";
import {
  Props,
  ValidationSchema,
  authFormErrorReducer,
  Action_Types,
  State,
  SubmitArg,
  Action,
  initialState
} from "./utils";
import { LoginUser as FormValues } from "../../graphql/apollo-types/globalTypes";
import { refreshToHome } from "../../refresh-to-app";
import PwdInput from "../PwdInput";
import { getConnStatus } from "../../state/get-conn-status";
import { noop } from "../../constants";
import { LoginMutationFn } from "../../graphql/login.mutation";
import { LoginMutation_login } from "../../graphql/apollo-types/LoginMutation";
import { SidebarHeader } from "../SidebarHeader";
import { ToOtherAuthLink } from "../ToOtherAuthLink";

const Errors = React.memo(ErrorsComp, ErrorsCompEqual);

export function Login(props: Props) {
  const { login, updateLocalUser, client, location } = props;

  const [state, dispatch] = useReducer(authFormErrorReducer, initialState);

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
              dispatch({
                type: Action_Types.CLEAR_ALL_ERRORS,
                payload: null
              });

              if (!(await getConnStatus(client))) {
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
                updateLocalUser
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
              disabled={!dirty || isSubmitting}
              loading={isSubmitting}
              type="submit"
              fluid={true}
              basic={true}
            >
              <Icon name="checkmark" /> Submit
            </Button>
          </Form>
        </Card.Content>

        <Card.Content extra={true}>
          <ToOtherAuthLink
            pathname={(location as WindowLocation).pathname}
            className="to-sign-up-button"
            name="to-sign-up"
            isSubmitting={isSubmitting}
          />
        </Card.Content>
      </Card>
    );
  }

  return (
    <div className="components-login">
      <SidebarHeader title="Login to Ebnis" />

      <div className="main">
        <Formik
          initialValues={{ email: "", password: "" }}
          onSubmit={noop}
          render={renderForm}
          validationSchema={ValidationSchema}
          validateOnChange={false}
        />
      </div>
    </div>
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
      <Message
        error={true}
        onDismiss={function onDismiss() {
          dispatch({
            type: Action_Types.CLEAR_ALL_ERRORS,
            payload: null
          });
        }}
      >
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
  updateLocalUser
}: SubmitArg) {
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
    const result = await (login as LoginMutationFn)({
      variables: {
        login: values
      }
    });

    const user = (result &&
      result.data &&
      result.data.login) as LoginMutation_login;

    await updateLocalUser({
      variables: { user }
    });

    refreshToHome();
  } catch (error) {
    formikBag.setSubmitting(false);
    dispatch({ type: Action_Types.SET_GRAPHQL_ERROR, payload: error });
  }
}

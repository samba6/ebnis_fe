import React, { useReducer, Dispatch, useRef, useContext } from "react";
import Card from "semantic-ui-react/dist/commonjs/views/Card";
import Button from "semantic-ui-react/dist/commonjs/elements/Button";
import Form from "semantic-ui-react/dist/commonjs/collections/Form";
import Icon from "semantic-ui-react/dist/commonjs/elements/Icon";
import Message from "semantic-ui-react/dist/commonjs/collections/Message";
import Input from "semantic-ui-react/dist/commonjs/elements/Input";
import { Formik, FastField, FieldProps, FormikProps, Field } from "formik";
import { WindowLocation } from "@reach/router";

import "./styles.scss";
import {
  Props,
  ValidationSchema,
  reducer,
  ActionType,
  State,
  Action,
  initialState,
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
import { scrollToTop } from "./scroll-to-top";
import { UserLocalQueryData } from "../../state/user.resolver";
import { LayoutContext } from "../Layout/utils";

export function Login(props: Props) {
  const {
    login,
    updateLocalUser,
    client,
    location,
    localUser: { loggedOutUser } = {} as UserLocalQueryData,
  } = props;

  const [state, dispatch] = useReducer(reducer, initialState);
  const { otherErrors, formErrors, serverFieldErrors, networkError } = state;
  const mainRef = useRef<HTMLDivElement>(null);
  const { persistor } = useContext(LayoutContext);

  function renderForm({
    dirty,
    isSubmitting,
    values,
    ...formikBag
  }: FormikProps<FormValues>) {
    return (
      <Card>
        <Errors
          errors={{ otherErrors, formErrors, serverFieldErrors, networkError }}
          dispatch={dispatch}
        />

        <Card.Content>
          <Form
            onSubmit={async function onSubmit() {
              dispatch([ActionType.clearAllErrors]);

              if (!(await getConnStatus(client))) {
                scrollToTop(mainRef.current);

                formikBag.setSubmitting(false);

                dispatch([ActionType.setOtherErrors, "You are not connected"]);

                return;
              }

              formikBag.setSubmitting(true);

              const errors = await formikBag.validateForm(values);

              if (errors.email || errors.password) {
                scrollToTop(mainRef.current);

                formikBag.setSubmitting(false);

                dispatch([ActionType.setFormError, errors]);

                return;
              }

              try {
                const result = await (login as LoginMutationFn)({
                  variables: {
                    login: values,
                  },
                });

                const user = (result &&
                  result.data &&
                  result.data.login) as LoginMutation_login;

                await updateLocalUser({
                  variables: { user },
                });

                refreshToHome(persistor);
              } catch (error) {
                scrollToTop(mainRef.current);

                formikBag.setSubmitting(false);

                dispatch([ActionType.setServerErrors, error]);
              }
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

      <div className="main" ref={mainRef} data-testid="components-login-main">
        <Formik
          initialValues={{
            email: loggedOutUser ? loggedOutUser.email : "",
            password: "",
          }}
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
      <Input {...field} type="email" autoComplete="off" id="email" />
    </Form.Field>
  );
}

function Errors(props: {
  errors: Pick<
    State,
    "formErrors" | "networkError" | "otherErrors" | "serverFieldErrors"
  >;
  dispatch: Dispatch<Action>;
}) {
  const { errors, dispatch } = props;

  const { otherErrors, formErrors, serverFieldErrors, networkError } = errors;

  let testId = "";
  let content = null;

  if (otherErrors) {
    testId = "other-errors";
    content = otherErrors;
  } else if (serverFieldErrors) {
    testId = "server-field-errors";
    content = serverFieldErrors;
  } else if (networkError) {
    testId = "network-error";
    content = networkError;
  } else if (formErrors) {
    testId = "form-errors";
    const { email, password } = formErrors;

    content = (
      <>
        <span>Errors in fields: </span>

        {email && (
          <div className="field-error">
            <span>Email: </span>
            <span>{email}</span>
          </div>
        )}

        {password && (
          <div className="field-error">
            <span>Password: </span>
            <span>{password}</span>
          </div>
        )}
      </>
    );
  }

  return content ? (
    <Card.Content data-testid={testId} extra={true}>
      <Message
        error={true}
        onDismiss={function onDismiss() {
          dispatch([ActionType.clearAllErrors]);
        }}
      >
        <Message.Content>{content}</Message.Content>
      </Message>
    </Card.Content>
  ) : null;
}

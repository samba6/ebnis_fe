import React, { useRef, useReducer } from "react";
import { Button, Card, Input, Message, Icon, Form } from "semantic-ui-react";
import { Formik, Field, FieldProps, FormikProps } from "formik";
import loIsEmpty from "lodash/isEmpty";
import { WindowLocation } from "@reach/router";
import makeClassNames from "classnames";

import "./styles.scss";
import {
  Props,
  initialFormValues,
  ValidationSchema,
  FormValuesKey,
  FORM_RENDER_PROPS,
  reducer,
  initialState,
  DispatchType,
  ActionTypes,
  ErrorSummary,
  FormFieldErrors,
  FormErrors
} from "./utils";
import { Registration } from "../../graphql/apollo-types/globalTypes";
import { refreshToHome } from "../../refresh-to-app";
import { getConnStatus } from "../../state/get-conn-status";
import { noop } from "../../constants";
import { UserRegMutationFn } from "../../graphql/user-reg.mutation";
import { scrollToTop } from "./scrollToTop";
import { UserFragment } from "../../graphql/apollo-types/UserFragment";
import { SidebarHeader } from "../SidebarHeader";
import { ToOtherAuthLink } from "../ToOtherAuthLink";

export function SignUp(props: Props) {
  const { client, regUser, updateLocalUser, location } = props;
  const mainRef = useRef<HTMLDivElement | null>(null);
  const [state, dispatch] = useReducer(reducer, initialState);
  const {
    otherErrors,
    showingErrorSummary,
    formErrors,
    networkError,
    serverFieldsErrors
  } = state;

  function renderForm({
    dirty,
    isSubmitting,
    values,
    ...formikBag
  }: FormikProps<Registration>) {
    return (
      <Card>
        <ErrorsSummary
          errors={{
            otherErrors,
            showingErrorSummary,
            formErrors,
            networkError,
            serverFieldsErrors
          }}
          dispatch={dispatch}
        />

        <Card.Content>
          <Form
            onSubmit={async function onSubmit() {
              dispatch({
                type: ActionTypes.clear_all_errors,
                payload: null
              });

              if (!(await getConnStatus(client))) {
                formikBag.setSubmitting(false);
                dispatch({
                  type: ActionTypes.set_other_errors,
                  payload: "You are not connected"
                });
                scrollToTop(mainRef);
                return;
              }

              formikBag.setSubmitting(true);
              const errors = await formikBag.validateForm(values);

              if (!loIsEmpty(errors)) {
                formikBag.setSubmitting(false);
                dispatch({
                  type: ActionTypes.set_form_errors,
                  payload: errors
                });
                scrollToTop(mainRef);

                return;
              }

              try {
                const result = await (regUser as UserRegMutationFn)({
                  variables: { registration: values }
                });

                const user = (result &&
                  result.data &&
                  result.data.registration) as UserFragment;

                await updateLocalUser({ variables: { user } });
                refreshToHome();
              } catch (error) {
                formikBag.setSubmitting(false);
                dispatch({
                  type: ActionTypes.set_server_errors,
                  payload: error
                });
                scrollToTop(mainRef);
              }
            }}
          >
            {Object.entries(FORM_RENDER_PROPS).map(([name, [label, type]]) => {
              return (
                <Field
                  key={name}
                  name={name}
                  render={(formProps: FieldProps<Registration>) => (
                    <InputComponent
                      label={label}
                      type={type}
                      formProps={formProps}
                      errors={{
                        formErrors,
                        serverFieldsErrors
                      }}
                    />
                  )}
                />
              );
            })}

            <Button
              id="sign-up-submit"
              name="sign-up-submit"
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
            className="to-login-button"
            pathname={(location as WindowLocation).pathname}
          />
        </Card.Content>
      </Card>
    );
  }

  return (
    <div className="routes-sign-up-route">
      <SidebarHeader title="Sign up for Ebnis" />

      <div className="main" ref={mainRef} data-testid="components-signup-main">
        <Formik
          initialValues={initialFormValues}
          onSubmit={noop}
          render={renderForm}
          validationSchema={ValidationSchema}
          validateOnChange={false}
        />
      </div>
    </div>
  );
}

interface FormErrorsProps {
  errors: ErrorSummary;
  dispatch: DispatchType;
}

function ErrorsSummary(props: FormErrorsProps) {
  const { errors, dispatch } = props;

  const {
    networkError,
    otherErrors,
    showingErrorSummary,
    formErrors,
    serverFieldsErrors
  } = errors;

  if (!showingErrorSummary) {
    return null;
  }

  let content = otherErrors as React.ReactNode;
  let testId = "other-errors";

  if (networkError) {
    content = networkError;
    testId = "network-error";
  } else if (formErrors || serverFieldsErrors) {
    testId = formErrors ? "form-errors" : "server-field-error";

    content = (
      <>
        <span>Errors in fields:</span>
        {Object.entries((formErrors || serverFieldsErrors) as FormErrors).map(
          ([k, err]: [string, string | undefined]) => {
            const label = FORM_RENDER_PROPS[k][0];
            return (
              <div key={label}>
                <div className="error-label">{label}</div>
                <div className="error-text">{err}</div>
              </div>
            );
          }
        )}
      </>
    );
  }

  return (
    <Card.Content extra={true} data-testid={testId}>
      <Message
        error={true}
        onDismiss={function onDismissed() {
          dispatch({
            type: ActionTypes.clear_error_summary
          });
        }}
      >
        <Message.Content>{content}</Message.Content>
      </Message>
    </Card.Content>
  );
}

function InputComponent({
  label,
  type,
  formProps,
  errors
}: {
  label: string;
  type: string;
  formProps: FieldProps<Registration>;
  errors: FormFieldErrors;
}) {
  const { field } = formProps;
  const name = field.name as FormValuesKey;
  const isSourceField = name === "source";
  const { formErrors, serverFieldsErrors } = errors;
  const fieldError = (formErrors || serverFieldsErrors || {})[name];

  return (
    <Form.Field
      className={makeClassNames({
        "form-field": true,
        disabled: isSourceField,
        error: fieldError
      })}
    >
      <label htmlFor={name}>{label}</label>

      <Input
        {...field}
        type={type}
        autoComplete="off"
        id={name}
        readOnly={isSourceField}
      />

      {fieldError && <div className="field-error">{fieldError}</div>}
    </Form.Field>
  );
}

import React, { useReducer, useContext } from "react";
import Card from "semantic-ui-react/dist/commonjs/views/Card";
import Icon from "semantic-ui-react/dist/commonjs/elements/Icon";
import Input from "semantic-ui-react/dist/commonjs/elements/Input";
import Form from "semantic-ui-react/dist/commonjs/collections/Form";
import Button from "semantic-ui-react/dist/commonjs/elements/Button";
import Message from "semantic-ui-react/dist/commonjs/collections/Message";
import { Formik, Field, FieldProps, FormikProps } from "formik";
import loIsEmpty from "lodash/isEmpty";
import { WindowLocation } from "@reach/router";
import makeClassNames from "classnames";
import "./signup.styles.scss";
import {
  Props,
  initialFormValues,
  ValidationSchema,
  FormValuesKey,
  FORM_RENDER_PROPS,
  reducer,
  DispatchType,
  ActionType,
  ErrorSummary,
  FormFieldErrors,
  FormErrors,
} from "./signup.utils";
import { Registration } from "../../graphql/apollo-types/globalTypes";
import { refreshToHome } from "../../refresh-to-app";
import { isConnected } from "../../state/connections";
import { noop } from "../../constants";
import { UserRegMutationFn } from "../../graphql/user-reg.mutation";
import { SidebarHeader } from "../SidebarHeader/sidebar-header.component";
import { ToOtherAuthLink } from "../ToOtherAuthLink";
import { LayoutContext } from "../Layout/layout.utils";
import { storeUser } from "../../state/users";
import { makeScrollIntoViewId } from "../scroll-into-view";

const scrollToTopId = makeScrollIntoViewId("signup");

export function SignUp(props: Props) {
  const { regUser, location, scrollToTop } = props;
  const [state, dispatch] = useReducer(reducer, {});
  const {
    otherErrors,
    showingErrorSummary,
    formErrors,
    networkError,
    serverFieldsErrors,
  } = state;

  const { persistor } = useContext(LayoutContext);

  function renderForm({
    dirty,
    isSubmitting,
    values,
    ...formikBag
  }: FormikProps<Registration>) {
    return (
      <Card id={scrollToTopId}>
        <ErrorsSummary
          errors={{
            otherErrors,
            showingErrorSummary,
            formErrors,
            networkError,
            serverFieldsErrors,
          }}
          dispatch={dispatch}
        />

        <Card.Content>
          <Form
            onSubmit={async function onSubmit() {
              dispatch([ActionType.clearAllErrors]);

              if (!isConnected()) {
                formikBag.setSubmitting(false);
                dispatch([ActionType.setOtherErrors, "You are not connected"]);
                scrollToTop(scrollToTopId, {
                  behavior: "smooth",
                });
                return;
              }

              formikBag.setSubmitting(true);
              const errors = await formikBag.validateForm(values);

              if (!loIsEmpty(errors)) {
                formikBag.setSubmitting(false);
                dispatch([ActionType.setFormErrors, errors]);

                scrollToTop(scrollToTopId, {
                  behavior: "smooth",
                });

                return;
              }

              try {
                const result = await (regUser as UserRegMutationFn)({
                  variables: { registration: values },
                });

                const user = result && result.data && result.data.registration;

                storeUser(user);
                refreshToHome(persistor);
              } catch (error) {
                formikBag.setSubmitting(false);
                dispatch([ActionType.setServerErrors, error]);
                scrollToTop(scrollToTopId, {
                  behavior: "smooth",
                });
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
                        serverFieldsErrors,
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

      <div className="main" id="components-signup-main">
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
    serverFieldsErrors,
  } = errors;

  if (!showingErrorSummary) {
    return null;
  }

  let content = otherErrors as React.ReactNode;
  let id = "other-errors";

  if (networkError) {
    content = networkError;
    id = "network-error";
  } else if (formErrors || serverFieldsErrors) {
    id = formErrors ? "form-errors" : "sign-up-server-field-error";

    content = (
      <>
        <span>Errors in fields:</span>
        {Object.entries((formErrors || serverFieldsErrors) as FormErrors).map(
          ([k, err]: [string, string | undefined], index) => {
            const label = FORM_RENDER_PROPS[k][0];
            return (
              <div key={label}>
                <div className="error-label">{label}</div>
                <div className="error-text" id={`error-text-${index}`}>
                  {err}
                </div>
              </div>
            );
          },
        )}
      </>
    );
  }

  return (
    <Card.Content extra={true} id={id}>
      <Message
        error={true}
        onDismiss={function onDismissed() {
          dispatch([ActionType.clearErrorSummary]);
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
  errors,
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
  const id = `sign-up-${name}`;

  return (
    <Form.Field
      className={makeClassNames({
        "form-field": true,
        disabled: isSourceField,
        error: fieldError,
      })}
      id={`${id}-field`}
    >
      <label htmlFor={id}>{label}</label>

      <Input
        {...field}
        type={type}
        autoComplete="off"
        id={id}
        readOnly={isSourceField}
      />

      {fieldError && (
        <div id={`${id}-error`} className="field-error">
          {fieldError}
        </div>
      )}
    </Form.Field>
  );
}

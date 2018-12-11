import React, { useState, useEffect, useRef } from "react";
import { Button, Card, Input, Message, Icon, Form } from "semantic-ui-react";
import {
  Formik,
  FastField,
  FieldProps,
  FormikProps,
  FormikActions,
  FormikErrors
} from "formik";
import loIsEmpty from "lodash-es/isEmpty";
import { ApolloError } from "apollo-client";

import "./sign-up.scss";
import {
  Props,
  initialFormValues,
  ValidationSchema,
  FormValuesKey
} from "./sign-up";
import { Registration } from "../../graphql/apollo-gql.d";
import { setTitle, LOGIN_URL } from "../../Routing";
import SidebarHeader from "../../components/SidebarHeader";
import refreshToHome from "../Login/refresh-to-home";

const FORM_RENDER_PROPS = {
  name: ["Name", "text"],
  email: ["Email", "email"],
  password: ["Password", "password"],
  passwordConfirmation: ["Password Confirm", "password"],
  source: ["Source", "text"]
};

export function SignUp(props: Props) {
  const { history, regUser } = props;
  const mainRef = useRef<HTMLDivElement | null>(null);

  const [formErrors, setFormErrors] = useState<
    undefined | FormikErrors<Registration>
  >(undefined);

  const [graphQlError, setGraphQlError] = useState<ApolloError | undefined>(
    undefined
  );

  useEffect(function setPageTitle() {
    setTitle("Sign up");

    return setTitle;
  }, []);

  function renderForm({
    dirty,
    isSubmitting,
    values,
    ...formikProps
  }: FormikProps<Registration>) {
    return (
      <Card>
        {renderSubmissionErrors()}

        <Card.Content>
          <Form onSubmit={() => submit(values, formikProps)}>
            {Object.entries(FORM_RENDER_PROPS).map(([name, [label, type]]) => {
              return (
                <FastField
                  key={name}
                  name={name}
                  render={renderInput(label, type)}
                />
              );
            })}

            <Button
              id="sign-up-submit"
              name="sign-up-submit"
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
            className="to-login-button"
            type="button"
            fluid={true}
            onClick={() => history.replace(LOGIN_URL)}
            disabled={isSubmitting}
          >
            Already have an account? Login
          </Button>
        </Card.Content>
      </Card>
    );
  }

  function renderInput(label: string, type: string) {
    return function renderInputInner(formProps: FieldProps<Registration>) {
      const { field } = formProps;
      const name = field.name as FormValuesKey;
      const isSourceField = name === "source";

      return (
        <Form.Field
          {...field}
          className={`form-field ${isSourceField ? "disabled" : ""}`}
          type={type}
          control={Input}
          placeholder={label}
          autoComplete="off"
          label={label}
          id={name}
          autoFocus={name === "name"}
          readOnly={isSourceField}
        />
      );
    };
  }

  function renderSubmissionErrors() {
    if (formErrors && !loIsEmpty(formErrors)) {
      return (
        <Card.Content extra={true}>
          <Message error={true} onDismiss={handleFormErrorDismissed}>
            <Message.Content>
              <span>Errors in fields:</span>
              {Object.entries(formErrors).map(([k, err]) => {
                const label = FORM_RENDER_PROPS[k][0];
                return (
                  <div key={label}>
                    <span>{label}</span>
                    <span>{err}</span>
                  </div>
                );
              })}
            </Message.Content>
          </Message>
        </Card.Content>
      );
    }

    if (graphQlError) {
      return (
        <Card.Content extra={true}>
          <Message error={true} onDismiss={handleFormErrorDismissed}>
            <Message.Content>{graphQlError.message}</Message.Content>
          </Message>
        </Card.Content>
      );
    }

    return undefined;
  }

  function handleFormErrorDismissed() {
    setGraphQlError(undefined);
    setFormErrors(undefined);
  }

  async function submit(
    values: Registration,
    formikBag: FormikActions<Registration>
  ) {
    setGraphQlError(undefined);
    setFormErrors(undefined);

    const errors = await formikBag.validateForm(values);

    formikBag.setSubmitting(true);

    if (!loIsEmpty(errors)) {
      formikBag.setSubmitting(false);
      setFormErrors(errors);
      scrollToTop();
      return;
    }

    if (!regUser) {
      return;
    }

    try {
      const result = await regUser({
        variables: {
          registration: values
        }
      });

      if (result && result.data) {
        const user = result.data.registration;

        await props.updateLocalUser({
          variables: { user }
        });

        refreshToHome();
      }
    } catch (error) {
      formikBag.setSubmitting(false);
      setGraphQlError(error);
      scrollToTop();
    }
  }

  function scrollToTop() {
    if (mainRef && mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }

  return (
    <div className="app-container">
      <SidebarHeader title="Sign up for Ebnis" wide={true} />

      <div className="app-main routes-sign-up-route" ref={mainRef}>
        <Formik
          initialValues={initialFormValues}
          onSubmit={nullSubmit}
          render={renderForm}
          validationSchema={ValidationSchema}
          validateOnChange={false}
        />
      </div>
    </div>
  );
}

export default SignUp;

function nullSubmit() {}

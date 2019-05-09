import React, { useEffect, useRef, useReducer, Dispatch } from "react";
import { Button, Card, Input, Message, Icon, Form } from "semantic-ui-react";
import { Formik, FastField, FieldProps, FormikProps } from "formik";
import loIsEmpty from "lodash/isEmpty";

import "./sign-up.scss";
import {
  Props,
  initialFormValues,
  ValidationSchema,
  FormValuesKey
} from "./sign-up";
import { Registration } from "../../graphql/apollo-gql";
import { setTitle, LOGIN_URL } from "../../routes";
import SidebarHeader from "../SidebarHeader";
import refreshToHomeDefault from "../../refresh-to-app";
import {
  authFormErrorReducer,
  Action_Types,
  State,
  Action
} from "../Login/login";
import getConnDefault from "../../state/get-conn-status";

const FORM_RENDER_PROPS = {
  name: ["Name", "text"],
  email: ["Email", "email"],
  password: ["Password", "password"],
  passwordConfirmation: ["Password Confirm", "password"],
  source: ["Source", "text"]
};

export function SignUp(props: Props) {
  const {
    client,
    history,
    regUser,
    updateLocalUser,
    refreshToHome = refreshToHomeDefault,
    scrollToTop = defaultScrollToTop,
    getConn = getConnDefault
  } = props;
  const mainRef = useRef<HTMLDivElement | null>(null);
  const [state, dispatch] = useReducer(authFormErrorReducer, {} as State);

  useEffect(function setPageTitle() {
    setTitle("Sign up");

    return setTitle;
  }, []);

  function renderForm({
    dirty,
    isSubmitting,
    values,
    ...formikBag
  }: FormikProps<Registration>) {
    return (
      <Card>
        <FormErrors errors={state} dispatch={dispatch} />

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
                scrollToTop();
                return;
              }

              if (!regUser) {
                formikBag.setSubmitting(false);
                dispatch({
                  type: Action_Types.SET_OTHER_ERRORS,
                  payload: "Unknown error"
                });
                scrollToTop();

                return;
              }

              formikBag.setSubmitting(true);
              const errors = await formikBag.validateForm(values);

              if (!loIsEmpty(errors)) {
                formikBag.setSubmitting(false);
                dispatch({
                  type: Action_Types.SET_FORM_ERROR,
                  payload: errors
                });
                scrollToTop();

                return;
              }

              try {
                const result = await regUser({
                  variables: { registration: values }
                });

                if (result && result.data) {
                  const user = result.data.registration;
                  await updateLocalUser({ variables: { user } });
                  refreshToHome();
                }
              } catch (error) {
                formikBag.setSubmitting(false);
                dispatch({
                  type: Action_Types.SET_GRAPHQL_ERROR,
                  payload: error
                });
                scrollToTop();
              }
            }}
          >
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
              <Icon name="checkmark" /> Submit
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

  function defaultScrollToTop() {
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
          onSubmit={() => null}
          render={renderForm}
          validationSchema={ValidationSchema}
          validateOnChange={false}
        />
      </div>
    </div>
  );
}

interface FormErrorsProps {
  errors: State;
  dispatch: Dispatch<Action>;
}

function FormErrors(props: FormErrorsProps) {
  const {
    errors: { formErrors, graphQlErrors, otherErrors },
    dispatch
  } = props;

  function getContent() {
    if (otherErrors) {
      return otherErrors;
    }

    if (formErrors) {
      return (
        <>
          <span>Errors in fields:</span>
          {Object.entries(formErrors).map(([k, err]) => {
            const label = FORM_RENDER_PROPS[k][0];
            return (
              <div key={label}>
                <div className="error-label">{label}</div>
                <div className="error-text">{err}</div>
              </div>
            );
          })}
        </>
      );
    }

    if (graphQlErrors) {
      return graphQlErrors.message;
    }

    return null;
  }

  const content = getContent();

  if (content) {
    return (
      <Card.Content extra={true} data-testid="sign-up-form-error">
        <Message error={true} onDismiss={() => handleErrorsDismissed(dispatch)}>
          <Message.Content>{content}</Message.Content>
        </Message>
      </Card.Content>
    );
  }

  return null;
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
        autoComplete="off"
        label={label}
        id={name}
        autoFocus={name === "name"}
        readOnly={isSourceField}
      />
    );
  };
}

function handleErrorsDismissed(dispatch: Dispatch<Action>) {
  dispatch({ type: Action_Types.SET_FORM_ERROR, payload: undefined });
  dispatch({ type: Action_Types.SET_GRAPHQL_ERROR, payload: undefined });
  dispatch({ type: Action_Types.SET_OTHER_ERRORS, payload: false });
}

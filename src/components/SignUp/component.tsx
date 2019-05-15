import React, { useRef, useReducer, Dispatch } from "react";
import { Button, Card, Input, Message, Icon, Form } from "semantic-ui-react";
import { Formik, FastField, FieldProps, FormikProps } from "formik";
import loIsEmpty from "lodash/isEmpty";
import { WindowLocation } from "@reach/router";

import "./styles.scss";
import {
  Props,
  initialFormValues,
  ValidationSchema,
  FormValuesKey,
  FORM_RENDER_PROPS
} from "./utils";
import { Registration } from "../../graphql/apollo-types/globalTypes";
import { refreshToHome } from "../../refresh-to-app";
import {
  authFormErrorReducer,
  Action_Types,
  State,
  Action
} from "../Login/utils";
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
  const [state, dispatch] = useReducer(authFormErrorReducer, {} as State);

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
                scrollToTop(mainRef);
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
                  type: Action_Types.SET_GRAPHQL_ERROR,
                  payload: error
                });
                scrollToTop(mainRef);
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
          <ToOtherAuthLink
            className="to-login-button"
            pathname={(location as WindowLocation).pathname}
          />
        </Card.Content>
      </Card>
    );
  }

  return (
    <div className="routes-sign-up-route" ref={mainRef}>
      <SidebarHeader title="Sign up for Ebnis" />

      <div className="main">
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
        <Message
          error={true}
          onDismiss={function onDismissed() {
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
        readOnly={isSourceField}
      />
    );
  };
}

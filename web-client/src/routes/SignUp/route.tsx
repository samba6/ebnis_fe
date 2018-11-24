import React from "react";
import { Button, Card, Input, Message, Icon, Form } from "semantic-ui-react";
import {
  Formik,
  FastField,
  FieldProps,
  FormikProps,
  FormikActions
} from "formik";
import loIsEmpty from "lodash/isEmpty";

import "./sign-up.scss";
import {
  Props,
  State,
  initialFormValues,
  ValidationSchema,
  FormValuesKey
} from "./sign-up";
import socket from "../../socket";
import { Registration } from "../../graphql/apollo-gql";
import { Route, setTitle } from "../../containers/App/app";

const FORM_RENDER_PROPS = {
  name: ["Name", "text"],
  email: ["Email", "email"],
  password: ["Password", "password"],
  passwordConfirmation: ["Password Confirm", "password"],
  source: ["Source", "text"]
};

export class SignUp extends React.Component<Props, State> {
  state: State = {};
  private mainRef = React.createRef<HTMLDivElement>();

  componentDidMount() {
    setTitle("Sign up");
  }

  componentWillMount() {
    setTitle();
  }

  render() {
    const { className } = this.props;

    return (
      <div className={className + " routes-sign-up-route"} ref={this.mainRef}>
        <Formik
          initialValues={initialFormValues}
          onSubmit={() => null}
          render={this.renderForm}
          validationSchema={ValidationSchema}
          validateOnChange={false}
        />
      </div>
    );
  }

  private renderForm = ({
    dirty,
    isSubmitting,
    values,
    ...formikProps
  }: FormikProps<Registration>) => {
    const { routeTo } = this.props;

    return (
      <Card>
        <Card.Content className="form-title" extra={true}>
          Sign up for Ebnis
        </Card.Content>

        {this.renderSubmissionErrors()}

        <Card.Content>
          <Form onSubmit={() => this.submit(values, formikProps)}>
            {Object.entries(FORM_RENDER_PROPS).map(([name, [label, type]]) => {
              return (
                <FastField
                  key={name}
                  name={name}
                  render={this.renderInput(label, type)}
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
            onClick={() => routeTo({ name: Route.LOGIN })}
            disabled={isSubmitting}
          >
            Already have an account? Login
          </Button>
        </Card.Content>
      </Card>
    );
  };

  private renderInput = (label: string, type: string) => (
    formProps: FieldProps<Registration>
  ) => {
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

  private renderSubmissionErrors = () => {
    const { graphQlError, formErrors } = this.state;

    if (formErrors && !loIsEmpty(formErrors)) {
      return (
        <Card.Content extra={true}>
          <Message error={true} onDismiss={this.handleFormErrorDismissed}>
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
          <Message error={true} onDismiss={this.handleFormErrorDismissed}>
            <Message.Content>{graphQlError.message}</Message.Content>
          </Message>
        </Card.Content>
      );
    }

    return undefined;
  };

  private handleFormErrorDismissed = () =>
    this.setState({ graphQlError: undefined, formErrors: undefined });

  private submit = async (
    values: Registration,
    formikBag: FormikActions<Registration>
  ) => {
    await this.setState({ formErrors: undefined, graphQlError: undefined });

    const errors = await formikBag.validateForm(values);

    formikBag.setSubmitting(true);

    if (!loIsEmpty(errors)) {
      formikBag.setSubmitting(false);
      this.setState({ formErrors: errors });
      this.scrollToTop();
      return;
    }

    const { regUser, routeTo } = this.props;

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

        if (user) {
          socket.connect(user.jwt);
        }

        await this.props.updateLocalUser({
          variables: { user }
        });

        routeTo({
          name: Route.HOME
        });
      }
    } catch (error) {
      formikBag.setSubmitting(false);
      this.setState({ graphQlError: error });
      this.scrollToTop();
    }
  };

  private scrollToTop = () => {
    if (this.mainRef && this.mainRef.current) {
      this.mainRef.current.scrollTop = 0;
    }
  };
}

export default SignUp;

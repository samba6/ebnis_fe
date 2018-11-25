import React from "react";
import { Button, Card, Input, Message, Icon, Form } from "semantic-ui-react";
import {
  Formik,
  FastField,
  FieldProps,
  FormikProps,
  FormikActions
} from "formik";

import "./login.scss";
import { Props, State, ValidationSchema } from "./login";
import Header from "../../components/Header";
import { LoginUser as FormValues } from "../../graphql/apollo-gql";
import socket from "../../socket";
import { setTitle, ROOT_URL, SIGN_UP_URL } from "../../Routing";

export class Login extends React.Component<Props, State> {
  state: State = {};

  componentDidMount() {
    const { setHeader } = this.props;
    if (setHeader) {
      setHeader(<Header title="Login to your account" wide={true} />);
    }

    setTitle("Log in");
  }

  componentWillMount() {
    setTitle();
  }

  render() {
    const { className } = this.props;

    return (
      <div className={className + "app-main routes-login"}>
        <Formik
          initialValues={{ email: "", password: "" }}
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
  }: FormikProps<FormValues>) => {
    const { history } = this.props;

    return (
      <Card>
        {this.renderSubmissionErrors()}

        <Card.Content>
          <Form onSubmit={() => this.submit(values, formikProps)}>
            <FastField name="email" render={this.renderEmailInput} />

            <FastField name="password" render={this.renderPwdInput} />

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
              <Icon name="checkmark" /> Ok
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
  };

  private submit = async (
    values: FormValues,
    formikBag: FormikActions<FormValues>
  ) => {
    await this.setState({ formErrors: undefined, graphQlErrors: undefined });

    const errors = await formikBag.validateForm(values);

    formikBag.setSubmitting(true);

    if (errors.email || errors.password) {
      formikBag.setSubmitting(false);
      this.setState({ formErrors: errors });
      return;
    }

    const { login, history } = this.props;

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

        if (user) {
          socket.connect(user.jwt);
        }

        await this.props.updateLocalUser({
          variables: { user }
        });

        history.replace(ROOT_URL);
      }
    } catch (error) {
      formikBag.setSubmitting(false);
      this.setState({ graphQlErrors: error });
    }
  };

  private renderEmailInput = (formProps: FieldProps<FormValues>) => {
    const { field } = formProps;

    return (
      <Form.Field
        {...field}
        control={Input}
        placeholder="Email"
        autoComplete="off"
        label="Email"
        id="email"
        autoFocus={true}
      />
    );
  };

  private renderPwdInput = (formProps: FieldProps<FormValues>) => {
    const { field } = formProps;

    return (
      <Form.Field
        {...field}
        control={Input}
        placeholder="Password"
        autoComplete="off"
        label="Password"
        id="password"
        autoFocus={true}
      />
    );
  };

  private renderSubmissionErrors = () => {
    const { graphQlErrors, formErrors } = this.state;

    if (formErrors) {
      const { email, password } = formErrors;

      if (!(email || password)) {
        return undefined;
      }

      return (
        <Card.Content extra={true}>
          <Message error={true} onDismiss={this.handleFormErrorDismissed}>
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
          <Message error={true} onDismiss={this.handleFormErrorDismissed}>
            <Message.Content>{graphQlErrors.message}</Message.Content>
          </Message>
        </Card.Content>
      );
    }

    return undefined;
  };

  private handleFormErrorDismissed = () =>
    this.setState({ graphQlErrors: undefined, formErrors: undefined });
}

export default Login;

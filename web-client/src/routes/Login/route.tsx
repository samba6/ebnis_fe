import React, { Component } from "react";

import { Props } from "./login";
import { Route } from "../../containers/App/app";
import Header from "../../components/Header";

export class Login extends Component<Props> {
  componentDidMount() {
    const { setHeader } = this.props;

    if (setHeader) {
      setHeader(<Header title="Login to your account" wide={true} />);
    }
  }

  render() {
    return (
      <div>
        Login
        <button
          onClick={() =>
            this.props.routeTo({
              name: Route.SIGN_UP
            })
          }
        >
          Go to SignUp
        </button>
      </div>
    );
  }
}

export default Login;

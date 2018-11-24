import React, { Component } from "react";

import { Props } from "./login";
import { Route } from "../../containers/App/app";

export class Login extends Component<Props> {
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
          Got to SignUp
        </button>
      </div>
    );
  }
}

export default Login;

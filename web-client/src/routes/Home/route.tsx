import React, { Component } from "react";

import { Props } from "./home";
import { Route } from "../../containers/App/app";

export class Home extends Component<Props> {
  render() {
    return (
      <div className={this.props.className}>
        Home
        <button
          onClick={() =>
            this.props.routeTo({
              name: Route.LOGIN
            })
          }
        >
          Go to LOGIN
        </button>
      </div>
    );
  }
}

export default Home;

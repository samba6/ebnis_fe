import React, { lazy, Suspense } from "react";

import "./app.scss";
import Header from "../../components/Header";
import { Route, State, initialMediaQueries, RoutingProps } from "./app";

const routes = {
  [Route.LOGIN]: lazy(() => import("./../../routes/Login")),
  [Route.HOME]: lazy(() => import("./../../routes/Home"))
};

const Loading = () => <div>Loading</div>;

export class App extends React.Component {
  state: State = {
    component: routes[Route.LOGIN],
    mediaQueries: initialMediaQueries
  };

  render() {
    const { component: Component, header: HeaderComp = Header } = this.state;
    const { routeTo } = this;

    return (
      <div className="containers-app">
        <HeaderComp />
        <Suspense fallback={<Loading />}>
          <Component className="app-main" routeTo={routeTo} />
        </Suspense>
      </div>
    );
  }

  private routeTo = (props: RoutingProps) => {
    const { name, header } = props;
    this.setState({ component: routes[name], header });
  };
}

export default App;

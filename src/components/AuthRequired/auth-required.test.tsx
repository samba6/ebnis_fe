import React from "react";
import "jest-dom/extend-expect";
import "react-testing-library/cleanup-after-each";
import { render } from "react-testing-library";
import { Switch, Route } from "react-router-dom";

import { renderWithRouter } from "../../test_utils";
import AuthRequired from "./auth-required-x";
import { UserLocalGqlData } from "../../state/auth.local.query";

function App(props: UserLocalGqlData = {}) {
  return (
    <Switch>
      <AuthRequired
        {...props}
        exact
        path="/my-path"
        component={() => <div>Home</div>}
      />

      <Route path="/login" component={() => <div>Login</div>} />
    </Switch>
  );
}

it("renders auth component when user is not null", () => {
  const { ui } = renderWithRouter(
    <App user={{ jwt: "jwt", email: "e", name: "x", id: "id" }} />,
    {
      route: "/my-path"
    }
  );

  const { container } = render(ui);
  expect(container.innerHTML).toMatch("Home");
});

it("redirects to login when user is null", () => {
  const { ui } = renderWithRouter(<App />, {
    route: "/my-path"
  });

  const { container } = render(ui);
  expect(container.innerHTML).toMatch("Login");
});

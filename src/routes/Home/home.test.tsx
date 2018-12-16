import React from "react";
import "jest-dom/extend-expect";
import "react-testing-library/cleanup-after-each";
import { render } from "react-testing-library";

import Home from "./home-x";
import { Props } from "./home";
import { renderWithRouter } from "../../test_utils";

it("renders loading state and not main", () => {
  const { ui } = makeComp({ loading: true });
  const { getByTestId, getByText } = render(ui);

  expect(getByTestId("loading-spinner")).toBeInTheDocument();
  expect(getByText("Home")).toBeInTheDocument();
});

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
////////////////////////// HELPER FUNCTIONS ///////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

function makeComp(props: Props | {} = {}) {
  const Home1 = Home as (props: Props | {}) => JSX.Element;
  return renderWithRouter(<Home1 {...props} />);
}

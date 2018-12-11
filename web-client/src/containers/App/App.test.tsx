import React from "react";
import "jest-dom/extend-expect";
import "react-testing-library/cleanup-after-each";
import { render } from "react-testing-library";
import App from "./app-x";

it("renders without crashing", () => {
  const { rerender, container, getByTestId, debug } = render(<App />);

  const { firstChild: app } = container;
  expect(app).toContainElement(getByTestId("loading-spinner"));

  // we need to re-render so react can flush all effects
  rerender(<App />);
  expect(app).toContainElement(getByTestId("sidebar-container"));

  debug();
});

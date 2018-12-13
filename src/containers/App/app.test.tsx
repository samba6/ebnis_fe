import React from "react";
import "jest-dom/extend-expect";
import "react-testing-library/cleanup-after-each";
import { render } from "react-testing-library";

import { renderWithApollo } from "../../test_utils";
import App from "./app-x";

it("renders without crashing", () => {
  const mockedPersistCache = jest.fn();
  const { ui } = renderWithApollo(<App persistCache={mockedPersistCache} />);
  const { rerender, container, getByTestId } = render(ui);

  const { firstChild: app } = container;
  expect(app).toContainElement(getByTestId("loading-spinner"));

  const $title = getByTestId("app-header-title");
  expect(app).toContainElement($title);
  expect($title.textContent).toBe("");

  // we need to re-render so react can flush all effects
  rerender(ui);
  expect(mockedPersistCache.mock.calls.length).toBe(1);
});

import React from "react";
import "jest-dom/extend-expect";
import "react-testing-library/cleanup-after-each";

import { renderWithApollo } from "../../test_utils";
import App from "./app-x";

it("renders without crashing", () => {
  const mockedPersistCache = jest.fn();

  const { ui, rerender, container, getByTestId } = renderWithApollo(
    <App persistCache={mockedPersistCache} />
  );

  const { firstChild: app } = container;
  expect(app).toContainElement(getByTestId("loading-spinner"));

  const $title = getByTestId("app-header-title");
  expect(app).toContainElement($title);
  expect($title.textContent).toBe("");

  // we need to re-render so react can flush all effects
  rerender(ui);
  expect(mockedPersistCache.mock.calls.length).toBe(1);
});

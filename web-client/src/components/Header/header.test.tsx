import React from "react";
import "jest-dom/extend-expect";
import "react-testing-library/cleanup-after-each";
import { render } from "react-testing-library";
import { Header } from "./header-x";

test("renders Header component with logo, title and no sidebar trigger", () => {
  const title = "My Ebnis App";
  const {
    queryByTestId,
    getByAltText,
    getByText,
    container: { firstChild: header }
  } = render(<Header title={title} />);

  expect(header).toContainElement(getByAltText(/logo/i));
  expect(header).toContainElement(getByText(title));
  expect(queryByTestId("sidebar-trigger")).not.toBeInTheDocument();
});

test("renders Header component with sidebar trigger", () => {
  const { getByTestId, container } = render(
    <Header title="My Ebnis App" sidebar={true} />
  );

  const { firstChild: header } = container;
  const sidebarTrigger = getByTestId("sidebar-trigger");
  expect(header).toContainElement(sidebarTrigger);
});

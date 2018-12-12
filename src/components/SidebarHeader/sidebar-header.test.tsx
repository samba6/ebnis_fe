import React from "react";
import "jest-dom/extend-expect";
import { render } from "react-testing-library";

import { SidebarHeader } from "./sidebar-header";

const title = "My shinning app";

it("renders with header no sidebar", () => {
  const { container, getByTestId, queryByTestId } = render(
    <SidebarHeader title={title} />
  );

  const sidebarHeader = container.firstChild;
  expect(sidebarHeader).toContainElement(getByTestId("app-header"));
  expect(sidebarHeader).not.toContainElement(queryByTestId("app-sidebar"));
});

// it("renders with header and sidebar", () => {
//   const { container, debug, getByTestId } = render(
//     <SidebarHeader title={title} sidebar={true} />
//   );

//   const sidebarHeader = container.firstChild;
//   expect(sidebarHeader).toContainElement(getByTestId("app-header"));
//   expect(sidebarHeader).toContainElement(getByTestId("app-sidebar"));

//   debug(sidebarHeader);
// });

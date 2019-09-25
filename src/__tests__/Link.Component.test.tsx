/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { ComponentType } from "react";
import "@marko/testing-library/cleanup-after-each";
import { render } from "@testing-library/react";
import { Link, Props } from "../components/Link";
import { LocationProvider } from "../components/Layout/layout-providers";

it("renders", () => {
  const { ui, mockNavigate } = makeComp({
    props: {
      to: "/me",
      children: <div id="oo" />,
      id: "11",
    },
  });

  const {} = render(ui);
  const $link = document.getElementById("11") as HTMLAnchorElement;

  expect(mockNavigate).not.toHaveBeenCalled();
  $link.click();
  expect(mockNavigate).toHaveBeenCalledWith("/me");
  expect(document.getElementById("oo")).not.toBeNull();
});

////////////////////////// HELPER FUNCTIONS ///////////////////////////

const LinkP = Link as ComponentType<Partial<Props>>;

function makeComp({ props = {} }: { props?: Partial<Props> } = {}) {
  const mockNavigate = jest.fn();

  return {
    ui: (
      <LocationProvider value={{ navigate: mockNavigate } as any}>
        <LinkP {...props} />
      </LocationProvider>
    ),

    mockNavigate,
  };
}

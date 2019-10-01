/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { ComponentType } from "react";
import "@marko/testing-library/cleanup-after-each";
import { render } from "@testing-library/react";
import {
  ExperienceRoute,
  Props,
} from "../components/ExperienceRoute/experience-route.component";

jest.mock("../components/Experience/experience.component", () => ({
  Experience: () => null,

  getTitle: jest.fn(() => "cool"),
}));

jest.mock("@apollo/react-hooks", () => ({
  useMutation: () => [],
}));

it("renders correctly", () => {
  const { ui } = makeComp({
    props: {},
  });

  const {} = render(ui);
});

////////////////////////// HELPER FUNCTIONS ///////////////////////////////////

const ExperienceRouteP = ExperienceRoute as ComponentType<Partial<Props>>;

function makeComp({ props = {} }: { props?: Partial<Props> } = {}) {
  return {
    ui: <ExperienceRouteP {...props} />,
  };
}

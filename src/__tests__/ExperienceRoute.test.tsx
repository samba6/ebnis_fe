// tslint:disable: no-any
import React, { ComponentType } from "react";
import "jest-dom/extend-expect";
import "react-testing-library/cleanup-after-each";
import { render } from "react-testing-library";
import { ExperienceRoute } from "../components/ExperienceRoute/experience-route.component";
import { Props } from "../components/ExperienceRoute/experience-route.utils";

jest.mock("../components/SidebarHeader/sidebar-header", () => ({
  SidebarHeader: () => null,
}));

jest.mock("../components/Experience/experience.component", () => ({
  Experience: () => null,

  getTitle: jest.fn(() => "cool"),
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

/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { ComponentType } from "react";
import "react-testing-library/cleanup-after-each";
import { render } from "react-testing-library";
import { ExperienceNewEntryParent } from "../components/ExperienceNewEntryParent/experience-new-entry.component";
import { Props } from "../components/ExperienceNewEntryParent/experience-new-entry.utils";
import { renderWithRouter } from "./test_utils";
import { NEW_ENTRY_URL } from "../constants/new-entry-route";

jest.mock("../components/ExperienceNewEntryParent/loadables", () => ({
  NewEntry: () => <div id="new-entry-page" />,

  ExperienceRoute: () => <div id="experience-page" />,
}));

jest.mock("../components/Loading/loading", () => ({
  Loading: () => <div id="a-a-l" />,
}));

it("renders loading indicator if we have not returned from server", () => {
  const { ui } = makeComp({
    props: {
      getExperienceGql: { loading: true } as any,
    },
  });

  /**
   * While we are on new entry page
   */
  render(ui);

  expect(document.getElementById("a-a-l")).not.toBeNull();
});

it("redirects to 404 page when no experience to render", () => {
  const { mockNavigate, ui } = makeComp({});

  render(ui);

  expect(mockNavigate).toBeCalledWith("/404");
});

it("redirects to 404 page when getting experience from server errors", () => {
  const { mockNavigate, ui } = makeComp({
    props: {
      getExperienceGql: { error: {} } as any,
    },
  });

  render(ui);

  expect(mockNavigate).toBeCalledWith("/404");
});

it("loads NewEntry page", () => {
  /**
   * Given there is unsaved experience in the system and we request
   * the component from new entry route
   */
  const { ui } = makeComp({
    props: {
      getExperienceGql: { exp: {} } as any,
      path: NEW_ENTRY_URL,
    },
  });

  /**
   * When we use the component
   */
  render(ui);

  /**
   * Then new entry page should be loaded
   */

  expect(document.getElementById("new-entry-page")).not.toBeNull();

  /**
   * And experience page should not be loaded
   */
  expect(document.getElementById("experience-page")).toBeNull();
});

it("loads Experience page", () => {
  /**
   * Given there is server experience in the system and we did not request
   * the component from new entry route
   */
  const { ui } = makeComp({
    props: {
      getExperienceGql: { exp: {} } as any,
    },
  });

  /**
   * When we use the component
   */
  render(ui);

  /**
   * Then experience page should be loaded
   */

  expect(document.getElementById("experience-page")).not.toBeNull();

  /**
   * And new entry page should not be loaded
   */
  expect(document.getElementById("new-entry-page")).toBeNull();
});

////////////////////////// HELPER FUNCTIONS ///////////////////////////////////

const ExperienceNewEntryParentP = ExperienceNewEntryParent as ComponentType<
  Partial<Props>
>;

function makeComp({ props = {} }: { props?: Partial<Props> } = {}) {
  const { Ui, ...rest } = renderWithRouter(ExperienceNewEntryParentP);

  return {
    ui: <Ui {...props} />,
    ...rest,
  };
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { ComponentType } from "react";
import "react-testing-library/cleanup-after-each";
import { render, fireEvent } from "react-testing-library";
import { MyExperiences } from "../components/MyExperiences/my-experiences.component";
import { Props } from "../components/MyExperiences/my-experiences.utils";
import { renderWithRouter, fillField } from "./test_utils";
import { ExperienceConnectionFragment } from "../graphql/apollo-types/ExperienceConnectionFragment";
import { LayoutProvider } from "../components/Layout/layout-provider";
import { ILayoutContextContextValue } from "../components/Layout/layout.utils";

jest.mock("../components/SidebarHeader/sidebar-header.component", () => ({
  SidebarHeader: jest.fn(() => null),
}));

jest.mock("../components/Loading/loading", () => ({
  Loading: () => <div id="loading-a-a" />,
}));

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.clearAllTimers();
});

it("renders loading state and not main", () => {
  const { ui } = makeComp({
    getExperiencesMiniProps: { loading: true } as any,
  });

  render(ui);

  expect(document.getElementById("loading-a-a")).not.toBeNull();
  expect(document.getElementById("new-experience-button")).toBeNull();
});

it("does not render empty experiences", () => {
  const { ui } = makeComp({
    getExperiencesMiniProps: { getExperiences: { edges: [] } } as any,
  });

  render(ui);

  expect(document.getElementById("loading-a-a")).toBeNull();

  expect(document.getElementById("experiences-container")).toBeNull();

  expect(document.getElementById("no-experiences-info")).not.toBeNull();
});

it("renders experiences from server", () => {
  /**
   * Given there are experiences in the system
   */

  const getExperiences = {
    edges: [
      {
        node: {
          id: "1",
          description: "d1",
          title: "t1",
        },
      },

      {
        node: {
          id: "2",
          title: "t2",
          description: null,
        },
      },
    ],
  } as ExperienceConnectionFragment;

  const { ui } = makeComp({
    getExperiencesMiniProps: { getExperiences } as any,
  });

  /**
   * When we use the component
   */

  render(ui);

  /**
   * Then experience 2 should not have UI to toggle description
   */

  expect(document.getElementById(`experience-description-toggle-2`)).toBeNull();

  /**
   * And experience 2 description should not be visible
   */

  expect(document.getElementById(`experience-description-2`)).toBeNull();

  /**
   * But experience 1 description toggle UI should be visible
   */

  let $expToggle = document.getElementById(
    "experience-description-toggle-1",
  ) as HTMLElement;

  /**
   * And the toggle UI should have right caret
   */

  expect($expToggle.classList).toContain("right");

  /**
   * And experience 1 description should not be visible
   */

  expect(document.getElementById(`experience-description-1`)).toBeNull();

  /**
   * And the toggle UI should not have down caret
   */

  expect($expToggle.classList).not.toContain("down");

  /**
   * When the toggle UI is clicked
   */

  fireEvent.click($expToggle);

  $expToggle = document.getElementById(
    "experience-description-toggle-1",
  ) as HTMLElement;

  /**
   * Then toggle UI should have down caret
   */

  expect($expToggle.classList).toContain("down");

  /**
   * And toggle UI should not have a right caret
   */

  expect($expToggle.classList).not.toContain("right");

  /**
   * And experience 1 description should be visible
   */

  expect(document.getElementById("experience-description-1")).not.toBeNull();

  /**
   * When the toggle UI is clicked again
   */

  fireEvent.click($expToggle);

  /**
   * Then the toggle UI should contain right caret
   */

  expect($expToggle.classList).toContain("right");

  /**
   * And the toggle UI should not contain down
   */

  expect($expToggle.classList).not.toContain("down");

  /**
   * And experience 1 description should not be visible
   */

  expect(document.getElementById("experience-description-1")).toBeNull();
});

it("loads full experiences in the background when experiences are loaded", async done => {
  jest.useFakeTimers();

  const getExperiences = {
    edges: [
      {
        node: {
          id: "1",
          title: "1",
        },
      },

      {
        node: {
          id: "2",
          title: "2",
          hasUnsaved: true,
        },
      },
    ],
  } as ExperienceConnectionFragment;

  const { ui, mockLayoutDispatch } = makeComp({
    getExperiencesMiniProps: { getExperiences } as any,
  });

  render(ui);

  jest.runAllTimers();

  expect((mockLayoutDispatch.mock.calls[0][0] as any).ids).toEqual(["1"]);

  done();
});

it("does not load entries in background when experiences are loaded but empty", () => {
  const { ui, mockLayoutDispatch } = makeComp({
    getExperiencesMiniProps: {
      getExperiences: {
        edges: [],
      },
    } as any,
  });

  render(ui);

  jest.runAllTimers();

  expect(mockLayoutDispatch).not.toHaveBeenCalled();
});

it("renders error ui if we are unable to get experiences", () => {
  const { ui } = makeComp();

  /**
   * When we use the component
   */
  render(ui);

  /**
   * Then we should load entries for the experiences in the background
   */

  expect(document.getElementById("no-experiences-error")).not.toBeNull();
});

it("goes to detailed experience page on search", () => {
  /**
   * Given there are experiences in the system
   */

  const getExperiences = {
    edges: [
      {
        node: {
          id: "id1",
          description: "d1",
          title: "t1",
        },
      },

      {
        node: {
          id: "id2",
          title: "t2",
          description: null,
        },
      },
    ],
  } as ExperienceConnectionFragment;

  const { ui } = makeComp({
    getExperiencesMiniProps: { getExperiences } as any,
  });

  /**
   * When we use the component
   */

  render(ui);

  /**
   * Then we should not see title 1 search result
   */

  expect(document.getElementById("search-result-id1")).toBeNull();

  /**
   * When we search for title 1
   */

  const $search = document.getElementById(
    "my-experiences-search",
  ) as HTMLInputElement;

  fillField($search, "t1");

  /**
   * Then experience 1 result should be a link to experience 1 detailed page.
   */

  jest.runAllTimers();

  let $result = document.getElementById("search-result-id1") as HTMLElement;

  expect($result.getAttribute("href")).toContain("id1");
});

////////////////////////// helper funcs ////////////////////////////

const MyExperiencesP = MyExperiences as ComponentType<Partial<Props>>;

function makeComp(props: Partial<Props> = {}) {
  const { Ui, ...rest } = renderWithRouter(MyExperiencesP);

  const mockLayoutDispatch = jest.fn();

  return {
    ui: (
      <LayoutProvider
        value={
          {
            layoutDispatch: mockLayoutDispatch as any,
          } as ILayoutContextContextValue
        }
      >
        <Ui {...props} />
      </LayoutProvider>
    ),

    mockLayoutDispatch,

    ...rest,
  };
}

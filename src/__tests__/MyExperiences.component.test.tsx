import React, { ComponentType } from "react";
import "react-testing-library/cleanup-after-each";
import { render, fireEvent } from "react-testing-library";
import { MyExperiences } from "../components/MyExperiences/my-experiences.component";
import { Props } from "../components/MyExperiences/my-experiences.utils";
import { renderWithRouter } from "./test_utils";
import { ExperienceConnectionFragment } from "../graphql/apollo-types/ExperienceConnectionFragment";
import { LayoutProvider } from "../components/Layout/layout-provider";
import { ILayoutContextContext } from "../components/Layout/layout.utils";

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
  const getExperiences = {
    edges: [
      {
        node: {
          id: "1",
          description: "lovely experience description 1",
          title: "love experience title 1",
        },
      },

      {
        node: {
          id: "2",
          title: "love experience title 2",
          description: null,
        },
      },
    ],
  } as ExperienceConnectionFragment;

  const { ui } = makeComp({
    getExperiencesMiniProps: { getExperiences } as any,
  });

  render(ui);

  expect(document.getElementById(`experience-description-toggle-2`)).toBeNull();
  expect(document.getElementById(`experience-description-2`)).toBeNull();

  let $expToggle = document.getElementById(
    "experience-description-toggle-1",
  ) as HTMLElement;

  expect($expToggle.classList).toContain("right");
  expect($expToggle.classList).not.toContain("down");

  fireEvent.click($expToggle);

  $expToggle = document.getElementById(
    "experience-description-toggle-1",
  ) as HTMLElement;

  expect($expToggle.classList).toContain("down");
  expect($expToggle.classList).not.toContain("right");

  expect(document.getElementById("experience-description-1")).not.toBeNull();

  fireEvent.click($expToggle);
  expect($expToggle.classList).toContain("right");
  expect($expToggle.classList).not.toContain("down");

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
          } as ILayoutContextContext
        }
      >
        <Ui {...props} />
      </LayoutProvider>
    ),

    mockLayoutDispatch,

    ...rest,
  };
}

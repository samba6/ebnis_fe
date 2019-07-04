/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { ComponentType } from "react";
import "jest-dom/extend-expect";
import "react-testing-library/cleanup-after-each";
import { render, fireEvent, wait } from "react-testing-library";
import { MyExperiences } from "../components/MyExperiences/component";
import { Props } from "../components/MyExperiences/utils";
import { renderWithRouter } from "./test_utils";
import { ExperienceConnectionFragment } from "../graphql/apollo-types/ExperienceConnectionFragment";
import { makeUnsavedId } from "../constants";
import { LayoutProvider } from "../components/Layout/layout-provider";
import { ILayoutContextContext } from "../components/Layout/utils";

jest.mock("../components/SidebarHeader", () => ({
  SidebarHeader: jest.fn(() => null),
}));

jest.mock("../components/MyExperiences/pre-fetch-experiences");
jest.mock("../state/get-conn-status");

import { preFetchExperiences } from "../components/MyExperiences/pre-fetch-experiences";
import { getConnStatus } from "../state/get-conn-status";

const mockPreFetchExperiences = preFetchExperiences as jest.Mock;
const mockGetConnStatus = getConnStatus as jest.Mock;

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

  const { getByTestId, queryByTestId } = render(ui);

  jest.advanceTimersByTime(10000);

  expect(getByTestId("loading-spinner")).toBeInTheDocument();
  expect(queryByTestId("home-route-main")).not.toBeInTheDocument();
  expect(queryByTestId("exps-container")).not.toBeInTheDocument();
});

it("does not render empty experiences", () => {
  const { ui } = makeComp({
    getExperiencesMiniProps: { getExperiences: { edges: [] } } as any,
  });

  const { getByText, queryByTestId } = render(ui);

  expect(queryByTestId("loading-spinner")).not.toBeInTheDocument();
  expect(queryByTestId("exps-container")).not.toBeInTheDocument();

  expect(
    getByText(/Click here to create your first experience/),
  ).toBeInTheDocument();
});

it("renders experiences from server", () => {
  const [id1, id2] = [new Date(), new Date()].map((d, index) =>
    (d.getTime() + index).toString(),
  );

  const getExperiences = {
    edges: [
      {
        node: {
          id: id1,
          description: "lovely experience description 1",
          title: "love experience title 1",
        },
      },

      {
        node: {
          id: id2,
          title: "love experience title 2",
          description: null,
        },
      },
    ],
  } as ExperienceConnectionFragment;

  const { ui } = makeComp({
    getExperiencesMiniProps: { getExperiences } as any,
  });

  const { queryByText, getByText, queryByTestId, getByTestId } = render(ui);

  expect(getByText("love experience title 2")).toBeInTheDocument();
  expect(queryByTestId(`exp-toggle-${id2}`)).not.toBeInTheDocument();

  const $exp1 = getByText("love experience title 1");
  expect($exp1).toBeInTheDocument();

  let $expToggle = getByTestId(`exp-toggle-${id1}`);
  expect($expToggle.classList).toContain("right");
  expect($expToggle.classList).not.toContain("down");

  fireEvent.click($expToggle);
  $expToggle = getByTestId(`exp-toggle-${id1}`);
  expect($expToggle.classList).toContain("down");
  expect($expToggle.classList).not.toContain("right");
  expect(getByText("lovely experience description 1")).toBeInTheDocument();

  fireEvent.click($expToggle);
  expect($expToggle.classList).toContain("right");
  expect($expToggle.classList).not.toContain("down");
  expect(
    queryByText("lovely experience description 1"),
  ).not.toBeInTheDocument();
});

it("loads entries in the background when experiences are loaded", async done => {
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
          id: makeUnsavedId("2"),
          title: "2",
        },
      },
    ],
  } as ExperienceConnectionFragment;

  const { ui } = makeComp({
    getExperiencesMiniProps: { getExperiences } as any,
  });

  render(ui);

  mockGetConnStatus.mockResolvedValue(true);

  jest.runAllTimers();

  await wait(() => {
    expect((mockPreFetchExperiences.mock.calls[0][0] as any).ids).toEqual([
      "1",
    ]);
  });

  done();
});

it("does not load entries in background when experiences are loaded but empty", () => {
  jest.useFakeTimers();

  const getExperiences = {
    edges: [],
  } as any;

  const { ui } = makeComp({
    getExperiencesMiniProps: { getExperiences } as any,
  });

  render(ui);

  mockGetConnStatus.mockResolvedValue(true);

  jest.runAllTimers();

  expect(mockPreFetchExperiences).not.toHaveBeenCalled();
});

it("does not load entries in background when we are not connected", () => {
  jest.useFakeTimers();

  const { ui } = makeComp({
    getExperiencesMiniProps: { getExperiences: { edges: [] } } as any,
  });

  render(ui);

  mockGetConnStatus.mockResolvedValue(false);

  jest.runAllTimers();

  expect(mockPreFetchExperiences).not.toHaveBeenCalled();
});

it("renders error ui if we are unable to get experiences", () => {
  const { ui } = makeComp();

  /**
   * When we use the component
   */
  const { getByTestId } = render(ui);

  /**
   * Then we should load entries for the experiences in the background
   */

  expect(getByTestId("no-experiences-error")).toBeInTheDocument();
});

////////////////////////// helper funcs ////////////////////////////

const MyExperiencesP = MyExperiences as ComponentType<Partial<Props>>;

function makeComp(props: Partial<Props> = {}) {
  mockPreFetchExperiences.mockReset();
  mockGetConnStatus.mockReset();

  const mockQuery = jest.fn();
  const client = {
    query: mockQuery,
  } as any;

  const { Ui, ...rest } = renderWithRouter(MyExperiencesP);

  return {
    ui: (
      <LayoutProvider value={{} as ILayoutContextContext}>
        <Ui client={client} {...props} />
      </LayoutProvider>
    ),
    mockQuery,

    ...rest,
  };
}

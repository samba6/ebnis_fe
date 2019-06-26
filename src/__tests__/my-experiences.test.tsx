// tslint:disable:no-any
import React, { ComponentType } from "react";
import "jest-dom/extend-expect";
import "react-testing-library/cleanup-after-each";
import { render, fireEvent } from "react-testing-library";

import { MyExperiences } from "../components/MyExperiences/component";
import { Props } from "../components/MyExperiences/utils";
import { renderWithRouter } from "./test_utils";

jest.mock("../components/SidebarHeader", () => ({
  SidebarHeader: jest.fn(() => null)
}));

jest.mock("../components/MyExperiences/pre-fetch-experiences");

import { preFetchExperiences } from "../components/MyExperiences/pre-fetch-experiences";
import {
  ExperienceConnectionFragment,
  ExperienceConnectionFragment_edges_node
} from "../graphql/apollo-types/ExperienceConnectionFragment";

const mockPreFetchExperiences = preFetchExperiences as jest.Mock;

const MyExperiencesP = MyExperiences as ComponentType<Partial<Props>>;

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.clearAllTimers();
});

it("renders loading state and not main", () => {
  const { Ui } = makeComp({
    getExperiencesMiniProps: { loading: true } as any
  });

  const { getByTestId, queryByTestId } = render(<Ui />);

  jest.advanceTimersByTime(10000);

  expect(getByTestId("loading-spinner")).toBeInTheDocument();
  expect(queryByTestId("home-route-main")).not.toBeInTheDocument();
  expect(queryByTestId("exps-container")).not.toBeInTheDocument();
});

it("does not render empty experiences", () => {
  const { Ui } = makeComp({
    getExperiencesMiniProps: { getExperiences: { edges: [] } } as any
  });

  const { getByText, queryByTestId } = render(<Ui />);

  expect(queryByTestId("loading-spinner")).not.toBeInTheDocument();
  expect(queryByTestId("exps-container")).not.toBeInTheDocument();

  expect(
    getByText(/Click here to create your first experience/)
  ).toBeInTheDocument();
});

it("renders experiences from server", () => {
  const [id1, id2] = [new Date(), new Date()].map((d, index) =>
    (d.getTime() + index).toString()
  );

  const getExperiences = {
    edges: [
      {
        node: {
          id: id1,
          description: "lovely experience description 1",
          title: "love experience title 1"
        }
      },

      {
        node: {
          id: id2,
          title: "love experience title 2",
          description: null
        }
      }
    ]
  } as ExperienceConnectionFragment;

  const { Ui } = makeComp({
    getExperiencesMiniProps: { getExperiences } as any
  });

  const { queryByText, getByText, queryByTestId, getByTestId } = render(<Ui />);

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
    queryByText("lovely experience description 1")
  ).not.toBeInTheDocument();
});

it("renders unsaved and saved experiences", () => {
  /**
   * Given that client has 2 unsaved experiences and 1 saved experience
   */
  const unsavedExperiences = [
    {
      id: "1",
      title: "1"
    },

    {
      id: "2",
      title: "2"
    }
  ] as ExperienceConnectionFragment_edges_node[];

  const getExperiences = {
    edges: [
      {
        node: {
          id: "3",
          title: "3"
        }
      }
    ]
  } as ExperienceConnectionFragment;

  const { Ui } = makeComp({
    unsavedExperiencesProps: { unsavedExperiences } as any,
    getExperiencesMiniProps: { getExperiences } as any
  });

  /**
   * When we use the component
   */
  const { getAllByTestId } = render(<Ui />);

  /**
   * Then we should only see 3 experiences
   */
  expect(getAllByTestId(/experience-main-/).length).toBe(3);
});

it("loads entries in the background when experiences are loaded", () => {
  jest.useFakeTimers();
  /**
   * Given there are experiences in the system
   */
  const getExperiences = {
    edges: [
      {
        node: {
          id: "1",
          title: "1"
        }
      },

      {
        node: {
          id: "2",
          title: "2"
        }
      }
    ]
  } as ExperienceConnectionFragment;

  const { Ui } = makeComp({
    getExperiencesMiniProps: { getExperiences } as any
  });

  /**
   * When we use the component
   */
  render(<Ui />);

  jest.runAllTimers();

  /**
   * Then we should load entries for the experiences in the background
   */

  expect((mockPreFetchExperiences.mock.calls[0][0] as any).ids).toEqual([
    "1",
    "2"
  ]);
});

it("does not load entries in background when experiences are loaded but empty", () => {
  /**
   * Given there are experiences in the system
   */
  const getExperiences = {
    edges: []
  } as any;

  const { Ui } = makeComp({
    getExperiencesMiniProps: { getExperiences } as any
  });

  /**
   * When we use the component
   */
  render(<Ui />);

  /**
   * Then we should load entries for the experiences in the background
   */

  expect(mockPreFetchExperiences).not.toHaveBeenCalled();
});

function makeComp({
  getExperiencesMiniProps = {} as any,
  ...props
}: Partial<Props> = {}) {
  mockPreFetchExperiences.mockReset();

  const mockQuery = jest.fn();
  const client = {
    query: mockQuery
  } as any;

  const { Ui, ...rest } = renderWithRouter(
    MyExperiencesP,
    {},
    {
      getExperiencesMiniProps,
      client,
      ...props
    }
  );

  return { Ui, mockQuery, ...rest };
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { ComponentType } from "react";
import "@marko/testing-library/cleanup-after-each";
import { render } from "@testing-library/react";
import {
  Props,
  ExperienceNewEntryParent,
} from "../components/ExperienceNewEntryParent/experience-new-entry-parent.component";
import { renderWithRouter } from "./test_utils";
import { NEW_ENTRY_URL } from "../constants/new-entry-route";
import { GetExperienceFullQueryResult } from "../graphql/get-experience-full.query";
import { GetExperienceFull_getExperience } from "../graphql/apollo-types/GetExperienceFull";
import { useQuery } from "@apollo/react-hooks";

jest.mock(
  "../components/ExperienceNewEntryParent/experience-new-entry-parent.loadables",
  () => ({
    NewEntry: () => <div id="new-entry-page" />,
    ExperienceRoute: () => <div id="experience-page" />,
  }),
);

jest.mock("../components/Loading/loading", () => ({
  Loading: () => <div id="a-a-l" />,
}));

jest.mock("@apollo/react-hooks");

const mockUseQuery = useQuery as jest.Mock;

beforeEach(() => {
  mockUseQuery.mockReset();
});

it("renders loading indicator if we have not returned from server", () => {
  const { ui } = makeComp({
    queryResults: {
      loading: true,
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
    queryResults: {
      error: {} as any,
    },
  });

  render(ui);

  expect(mockNavigate).toBeCalledWith("/404");
});

it("loads NewEntry page", () => {
  /**
   * Given component is requested from new entry url
   */
  const { ui } = makeComp({
    props: {
      path: NEW_ENTRY_URL,
    },
  });

  /**
   * When component is loaded
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
   * Given no path is specified when component is requested
   */
  const { ui } = makeComp({
    queryResults: {
      getExperience: {} as any,
    },
  });

  /**
   * When component is rendered
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

const defaultArgs: Args = {
  props: {},
  queryResults: {},
};

function makeComp(args: Args = {}) {
  const { Ui, ...rest } = renderWithRouter(ExperienceNewEntryParentP);
  args = { ...defaultArgs, ...args };
  const props = args.props as Partial<Props>;
  const queryResultsProps = args.queryResults as QueryResultProps;
  const queryResults = { ...queryResultsProps } as GetExperienceFullQueryResult;

  if (queryResultsProps.getExperience) {
    queryResults.data = {
      getExperience: queryResultsProps.getExperience,
    };
  }

  mockUseQuery.mockReturnValue(queryResults);

  return {
    ui: <Ui {...props} />,
    ...rest,
  };
}

interface Args {
  props?: Partial<Props>;
  queryResults?: QueryResultProps;
}

interface QueryResultProps extends Partial<GetExperienceFullQueryResult> {
  getExperience?: GetExperienceFull_getExperience;
}

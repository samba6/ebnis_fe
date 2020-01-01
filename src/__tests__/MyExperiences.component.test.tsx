/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { ComponentType } from "react";
import "@marko/testing-library/cleanup-after-each";
import { render, fireEvent, act } from "@testing-library/react";
import { MyExperiences } from "../components/MyExperiences/my-experiences.component";
import {
  Props,
  reducer,
  ActionTypes,
  IStateMachine,
  Action,
} from "../components/MyExperiences/my-experiences.utils";
import { renderWithRouter, fillField } from "./test_utils";
import {
  ExperienceConnectionFragment,
  ExperienceConnectionFragment_edges_node,
} from "../graphql/apollo-types/ExperienceConnectionFragment";
import {
  LayoutUnchangingProvider,
  LayoutExperienceProvider,
} from "../components/Layout/layout-providers";
import {
  ILayoutUnchangingContextValue,
  ILayoutContextExperienceValue,
} from "../components/Layout/layout.utils";
import { cleanUpOnSearchExit } from "../components/MyExperiences/my-experiences.injectables";
import {
  GetExperienceConnectionMini_getExperiences,
  GetExperienceConnectionMini_getExperiences_edges,
} from "../graphql/apollo-types/GetExperienceConnectionMini";
import { useQuery } from "@apollo/react-hooks";
import { GetExperienceConnectionMiniQueryResult } from "../graphql/get-experience-connection-mini.query";

jest.mock("../components/SidebarHeader/sidebar-header.component", () => ({
  SidebarHeader: jest.fn(() => null),
}));

jest.mock("../components/Loading/loading", () => ({
  Loading: () => <div id="loading-a-a" />,
}));

jest.mock("../components/MyExperiences/my-experiences.injectables", () => ({
  cleanUpOnSearchExit: jest.fn(),
  searchDebounceTimeoutMs: 0,
}));

jest.mock("@apollo/react-hooks");

const mockCleanUpOnSearchExit = cleanUpOnSearchExit as jest.Mock;
const mockUseQuery = useQuery as jest.Mock;

describe("component", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockCleanUpOnSearchExit.mockClear();
    mockUseQuery.mockReset();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  it("renders loading state and not main", () => {
    const { ui } = makeComp({
      queryResults: { loading: true },
    });

    render(ui);

    expect(document.getElementById("loading-a-a")).not.toBeNull();
    expect(document.getElementById("new-experience-button")).toBeNull();
  });

  it("does not render empty experiences", () => {
    const { ui } = makeComp({
      queryResults: {
        getExperiences: {
          edges: [] as GetExperienceConnectionMini_getExperiences_edges[],
        } as GetExperienceConnectionMini_getExperiences,
      },
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
      queryResults: {
        getExperiences,
      },
    });

    /**
     * When we use the component
     */

    render(ui);

    /**
     * Then experience 2 should not have UI to toggle description
     */

    expect(
      document.getElementById(`experience-description-toggle-2`),
    ).toBeNull();

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

  it("loads full experiences in the background when experiences are loaded", () => {
    /**
     * Given there is one saved and one unsaved experience in the system
     */

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
      queryResults: {
        getExperiences,
      },
    });

    /**
     * When we use the component
     */

    render(ui);

    /**
     * Then no experience should be fetched
     */

    expect(mockLayoutDispatch).not.toHaveBeenCalled();

    /**
     * After wait time to load experiences in background has elapsed
     */

    jest.runAllTimers();

    /**
     * Then the saved experience should have been pre fetched
     */

    expect((mockLayoutDispatch.mock.calls[0][0] as any).ids).toEqual(["1"]);
  });

  it("does not load entries in background when experiences are loaded but empty", () => {
    const { ui, mockLayoutDispatch } = makeComp({
      queryResults: {
        getExperiences: {
          edges: [] as GetExperienceConnectionMini_getExperiences_edges[],
        } as GetExperienceConnectionMini_getExperiences,
      },
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

  it("goes to detailed experience page on search", async () => {
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

    const { ui, mockNavigate } = makeComp({
      queryResults: {
        getExperiences,
      },
    });

    /**
     * And component is rendered
     */

    const { unmount } = render(ui);

    /**
     * Then we should not see title 1 search result
     */

    expect(document.getElementById("search-result-id1")).toBeNull();

    const $searchContainer = document.getElementsByClassName(
      "my-search",
    )[0] as HTMLDivElement;

    /**
     * And we should not see loading indicator
     */

    expect($searchContainer.classList).not.toContain("loading");

    /**
     * When we search for title 1
     */

    const $search = document.getElementById(
      "my-experiences-search",
    ) as HTMLInputElement;

    fillField($search, "t1");

    /**
     * Then we should see loading indicator
     */

    expect($searchContainer.classList).toContain("loading");

    /**
     * When search is completed
     */

    act(() => {
      jest.runAllTimers();
    });

    /**
     * Then loading indicator should no longer be visible;
     */

    expect($searchContainer.classList).not.toContain("loading");

    /**
     * Then search result for experience 1 should be visible
     */

    const $result = document.getElementById("search-result-id1") as HTMLElement;

    /**
     * When we click on the search result
     */

    $result.click();

    /**
     * Then we should be redirected to detailed page of experience 1
     */

    expect((mockNavigate as jest.Mock).mock.calls[0][0]).toContain("id1");

    /**
     * And search clean function should not be called
     */

    expect(mockCleanUpOnSearchExit).not.toHaveBeenCalled();

    /**
     * When the component is unmounted
     */

    unmount();

    /**
     * Then search clean function should be called
     */

    expect(mockCleanUpOnSearchExit).toHaveBeenCalled();
  });

  it("does not load any experience in the background if background experiences previously loaded", () => {
    /**
     * Given there is saved experience in the system
     */

    const getExperiences = {
      edges: [
        {
          node: {
            id: "1",
            title: "1",
          },
        },
      ],
    } as ExperienceConnectionFragment;

    const { ui, mockLayoutDispatch } = makeComp({
      queryResults: {
        getExperiences,
      },

      contexts: {
        layoutContextMyExpriencesValue: {
          fetchExperience: "already-fetched",
        },
      },
    });

    /**
     * When we use the component
     */

    render(ui);

    /**
     * Then no experience should be fetched
     */

    expect(mockLayoutDispatch).not.toHaveBeenCalled();

    /**
     * After wait time to load experiences in background has elapsed
     */

    jest.runAllTimers();

    /**
     * Then the saved experience should never be pre fetched
     */

    expect(mockLayoutDispatch).not.toHaveBeenCalled();
  });
});

describe("reducer", () => {
  it("prepares experiences for search", () => {
    const state = {
      context: {},
    } as IStateMachine;

    const experiences = [
      {
        id: "1",
        title: "aa",
      },
    ] as ExperienceConnectionFragment_edges_node[];

    const action = {
      type: ActionTypes.PREPARE_EXPERIENCES_FOR_SEARCH,
      experiences,
    } as Action;

    const nextState = reducer(state, action);

    expect(nextState.context.experiencesPrepared).toBeDefined();
  });
});

////////////////////////// helper funcs ////////////////////////////

const MyExperiencesP = MyExperiences as ComponentType<Partial<Props>>;

const defaultArgs: Args = {
  contexts: {
    layoutContextMyExpriencesValue: {
      fetchExperience: "never-fetched",
    },
  },

  queryResults: {},
};

function makeComp(args: Args = {} as Args) {
  args = { ...defaultArgs, ...args };
  const { Ui, ...rest } = renderWithRouter(MyExperiencesP);

  const mockLayoutDispatch = jest.fn();

  const queryResults = args.queryResults as GetExperiencesQueryResult;
  const results = {
    ...queryResults,
  } as GetExperienceConnectionMiniQueryResult;

  if (queryResults.getExperiences) {
    results.data = {
      getExperiences: queryResults.getExperiences,
    };
  }

  mockUseQuery.mockReturnValue(results);

  return {
    ui: (
      <LayoutUnchangingProvider
        value={
          {
            layoutDispatch: mockLayoutDispatch as any,
          } as ILayoutUnchangingContextValue
        }
      >
        <LayoutExperienceProvider
          value={
            (args.contexts as Contexts)
              .layoutContextMyExpriencesValue as ILayoutContextExperienceValue
          }
        >
          <Ui />
        </LayoutExperienceProvider>
      </LayoutUnchangingProvider>
    ),

    mockLayoutDispatch,

    ...rest,
  };
}

interface Contexts {
  layoutContextMyExpriencesValue?: ILayoutContextExperienceValue;
}

interface Args {
  contexts?: Contexts;

  queryResults?: GetExperiencesQueryResult;
}

interface GetExperiencesQueryResult {
  loading?: boolean;
  getExperiences?: GetExperienceConnectionMini_getExperiences;
}

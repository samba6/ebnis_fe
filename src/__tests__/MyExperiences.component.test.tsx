/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { ComponentType } from "react";
import "@marko/testing-library/cleanup-after-each";
import { render, act } from "@testing-library/react";
import { MyExperiences } from "../components/MyExperiences/my-experiences.component";
import {
  Props,
  computeFetchPolicy,
} from "../components/MyExperiences/my-experiences.utils";
import { renderWithRouter, fillField } from "./test_utils";
import { ExperienceConnectionFragment_edges_node } from "../graphql/apollo-types/ExperienceConnectionFragment";
import { cleanUpOnSearchExit } from "../components/MyExperiences/my-experiences.injectables";
import { defaultLoadingDomId } from "../components/Loading/loading-dom";
import {
  hideDescriptionIconSelector,
  toggleDescriptionMenuSelector,
  descriptionSelector,
  titleSelector,
  searchTextInputId,
  domPrefix,
  noSearchMatchId,
  experienceMenuSelector,
  deleteExperienceSelector,
} from "../components/MyExperiences/my-experiences.dom";
import { getDeletedExperienceTitle } from "../apollo-cache/should-delete-experience";

jest.mock("../components/SidebarHeader/sidebar-header.component", () => ({
  SidebarHeader: jest.fn(() => null),
}));

const mockLoadingId = defaultLoadingDomId;
jest.mock("../components/Loading/loading", () => ({
  Loading: () => <div id={mockLoadingId} />,
}));

jest.mock("../components/MyExperiences/my-experiences.injectables", () => ({
  cleanUpOnSearchExit: jest.fn(),
  searchDebounceTimeoutMs: 0,
}));
const mockCleanUpOnSearchExit = cleanUpOnSearchExit as jest.Mock;

jest.mock("../apollo-cache/should-delete-experience");
const mockGetDeletedExperienceTitle = getDeletedExperienceTitle as jest.Mock;

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.clearAllTimers();
  mockCleanUpOnSearchExit.mockReset();
  mockGetDeletedExperienceTitle.mockReset();
});

describe("component", () => {
  it("renders loading state and not main", () => {
    const { ui } = makeComp({
      props: { loading: true },
    });

    render(ui);

    expect(document.getElementById(mockLoadingId)).not.toBeNull();
  });

  it("does not render empty experiences", () => {
    const { ui } = makeComp();

    render(ui);
    expect(document.getElementById(mockLoadingId)).toBeNull();
    expect(document.getElementById("experiences-container")).toBeNull();
    expect(document.getElementById("no-experiences-info")).not.toBeNull();
  });

  it("renders experiences from server, toggles descriptions, goes to detailed page on title clicked, deletes online experience", async () => {
    /**
     * Given there are experiences in the system
     */

    const experiences = [
      {
        id: "1",
        description: "d1",
        title: "t1",
      },
      {
        id: "2",
        title: "t2",
        description: null,
      },
    ] as ExperienceConnectionFragment_edges_node[];

    const { ui, mockNavigate } = makeComp({
      props: {
        experiences,
      },
    });

    /**
     * When we use the component
     */

    render(ui);

    const experience1Dom = document.getElementById("1") as HTMLElement;
    const experience2Dom = document.getElementById("2") as HTMLElement;

    /**
     * Then experience 2 should not have UI to toggle description
     */

    expect(
      experience2Dom.getElementsByClassName(hideDescriptionIconSelector)[0],
    ).toBeUndefined();

    expect(
      experience2Dom.getElementsByClassName(toggleDescriptionMenuSelector)[0],
    ).toBeUndefined();

    /**
     * And experience 2 description should not be visible
     */

    expect(
      document.getElementsByClassName(descriptionSelector)[0],
    ).toBeUndefined();

    /**
     * And experience 1 description should not be visible
     */

    expect(
      experience1Dom.getElementsByClassName(descriptionSelector)[0],
    ).toBeUndefined();

    /**
     * When experience 1 show description icon is clicked
     */
    const experience1DropdownNode = experience1Dom
      .getElementsByClassName(experienceMenuSelector)
      .item(0) as HTMLElement;

    experience1DropdownNode.click();

    act(() => {
      (experience1DropdownNode.getElementsByClassName(
        toggleDescriptionMenuSelector,
      )[0] as HTMLElement).click();
    });

    /**
     * Then experience 1 description should be visible
     */

    expect(
      experience1Dom.getElementsByClassName(descriptionSelector)[0],
    ).toBeDefined();

    /**
     * When experience 1 hide description icon is clicked
     */
    act(() => {
      (experience1Dom.getElementsByClassName(
        hideDescriptionIconSelector,
      )[0] as HTMLElement).click();
    });

    /**
     * Then experience 1 description should not be visible
     */

    expect(
      experience1Dom.getElementsByClassName(descriptionSelector)[0],
    ).toBeUndefined();

    /**
     * And experience 1 show description icon should be visible
     */

    expect(
      experience1Dom.getElementsByClassName(
        toggleDescriptionMenuSelector,
      )[0] as HTMLElement,
    ).toBeDefined();

    /**
     * And experience 1 hide description icon should not be visible
     */

    expect(
      experience1Dom.getElementsByClassName(
        hideDescriptionIconSelector,
      )[0] as HTMLElement,
    ).toBeUndefined();

    /**
     * When experience 2 title is clicked
     */
    expect(mockNavigate).not.toHaveBeenCalled();

    act(() => {
      (experience2Dom.getElementsByClassName(
        titleSelector,
      )[0] as HTMLElement).click();
    });

    /**
     * Then window should navigate to experience 2 detailed page
     */
    expect((mockNavigate as jest.Mock).mock.calls).toHaveLength(1);

    /**
     * When delete experience is clicked
     */

    (experience1DropdownNode.getElementsByClassName(
      deleteExperienceSelector,
    )[0] as HTMLElement).click();

    /**
     * Then window should navigate to experience 2 detailed page
     */
    expect((mockNavigate as jest.Mock).mock.calls).toHaveLength(2);
  });

  it("renders error ui if we are unable to get experiences", () => {
    const { ui } = makeComp({
      props: { error: {} as any },
    });

    /**
     * When we use the component
     */
    render(ui);

    /**
     * Then we should load entries for the experiences in the background
     */

    expect(document.getElementById("no-experiences-error")).not.toBeNull();
  });

  it("goes to detailed experience page on search, shows recently deleted experience notification", () => {
    /**
     * Given there are experiences in the system
     */

    const experiences = [
      {
        id: "id1",
        description: "d1",
        title: "t1",
      },
      {
        id: "id2",
        title: "t2",
        description: null,
      },
    ] as ExperienceConnectionFragment_edges_node[];

    /**
     * And there is recently deleted experience in the system
     */
    mockGetDeletedExperienceTitle.mockReturnValue("t");

    const { ui, mockNavigate } = makeComp({
      props: {
        experiences,
      },
    });

    /**
     * When component is rendered
     */
    const { unmount } = render(ui);

    /**
     * Then notification should be visible
     */
    const notificationDom = document.getElementById(
      "close-notification",
    ) as HTMLElement;

    /**
     * When notification close is clicked
     */
    act(() => {
      notificationDom.click();
    });

    /**
     * Then notification should no longer be visible
     */
    expect(document.getElementById("close-notification")).toBeNull();

    /**
     * When main component window is clicked, then nothing should happen
     */

    const domMain = document.getElementById(domPrefix) as HTMLElement;
    // domMain.click();

    /**
     * Then we should not see title 1 search result
     */

    expect(document.getElementById("search-result-id1")).toBeNull();

    /**
     * When we search for title 1
     */

    const searchInputDom = document.getElementById(
      searchTextInputId,
    ) as HTMLInputElement;

    fillField(searchInputDom, "t1");

    /**
     * When search is completed
     */

    act(() => {
      jest.runAllTimers();
    });

    /**
     * Then search result for experience 1 should be visible
     */

    expect(document.getElementById("search-result-id1")).not.toBeNull();

    /**
     * When search input is clicked
     */
    searchInputDom.click();

    /**
     * Then search results should remain open
     */
    expect(document.getElementById("search-result-id1")).not.toBeNull();

    /**
     * When user clicks outside results menu
     */
    act(() => {
      domMain.click();
    });

    /**
     * Then search result for experience 1 should no longer be visible
     */

    expect(document.getElementById("search-result-id1")).toBeNull();

    /**
     * And no UI indicating no search results should be visible
     */
    expect(document.getElementById(noSearchMatchId)).toBeNull();

    /**
     * When search is run with text that does not match any of the experiences
     * titles
     */
    fillField(searchInputDom, "t1111");

    /**
     * Then UI indicating no search results should be visible
     */
    act(() => {
      jest.runAllTimers();
    });
    expect(document.getElementById(noSearchMatchId)).not.toBeNull();

    /**
     * When user clicks outside results menu
     */
    act(() => {
      domMain.click();
    });

    /**
     * Then no UI indicating no search results should be visible
     */
    expect(document.getElementById(noSearchMatchId)).toBeNull();

    /**
     * When search is conducted again and experience 1 search result is clicked
     */
    fillField(searchInputDom, "t1");

    act(() => {
      jest.runAllTimers();
    });

    (document.getElementById("search-result-id1") as HTMLElement).click();

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
});

describe("utilities", () => {
  test("computeFetchPolicy", () => {
    expect(computeFetchPolicy(true)).toBe("cache-first");
    expect(computeFetchPolicy(false)).toBe("cache-only");
  });
});

////////////////////////// helper funcs ////////////////////////////

const MyExperiencesP = MyExperiences as ComponentType<Partial<Props>>;

function makeComp({
  props = {},
}: {
  props?: Partial<Props>;
} = {}) {
  const { Ui, ...rest } = renderWithRouter(MyExperiencesP);
  const experiences = props.experiences || [];

  return {
    ui: <Ui experiences={experiences} {...props} />,
    ...rest,
  };
}

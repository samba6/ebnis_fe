/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { ComponentType } from "react";
import "@marko/testing-library/cleanup-after-each";
import { render, waitForElement, wait } from "@testing-library/react";
import { Layout } from "../components/Layout/layout.component";
import { EbnisAppProvider, EbnisContextProps } from "../context";
import { EmitActionType, makeObservable } from "../state/observable-manager";
import {
  ILayoutContextHeaderValue,
  Props,
  LayoutActionType,
  reducer,
  LayoutAction,
  LayoutDispatchType,
  ILayoutUnchangingContextValue,
  ILayoutContextExperienceValue,
  initState,
  StateValue,
  InitStateArgs,
} from "../components/Layout/layout.utils";
import { getOfflineItemsCount } from "../state/offline-resolvers";
import { isConnected } from "../state/connections";
import { useUser } from "../components/use-user";
import { E2EWindowObject } from "../state/apollo-setup";
import {
  preFetchExperiences,
  PreFetchExperiencesFnArgs,
} from "../components/Layout/pre-fetch-experiences";
import { WindowLocation } from "@reach/router";
import { act } from "react-dom/test-utils";

////////////////////////// MOCKS ////////////////////////////

jest.mock("../state/offline-resolvers");
const mockOfflineItemsCount = getOfflineItemsCount as jest.Mock;

jest.mock("../state/connections");
const mockIsConnected = isConnected as jest.Mock;

jest.mock("../components/Loading/loading", () => ({
  Loading: () => <div id="o-o-1" />,
}));

jest.mock("../components/use-user");
const mockUseUser = useUser as jest.Mock;

let layoutContextValue: null | ILayoutContextHeaderValue;
let layoutDispatch: LayoutDispatchType;
let layoutExperienceContextValue: null | ILayoutContextExperienceValue;
let locationContextValue: null | WindowLocation;

jest.mock("../components/Layout/layout-providers", () => ({
  LayoutProvider: ({ children, value }: any) => {
    layoutContextValue = value;

    return <>{children}</>;
    return children;
  },

  LayoutUnchangingProvider: ({ children, value }: any) => {
    layoutDispatch = (value as ILayoutUnchangingContextValue).layoutDispatch;

    return children;
  },

  LayoutExperienceProvider: ({ children, value }: any) => {
    layoutExperienceContextValue = value;
    return children;
  },

  LocationProvider: ({ children, value }: any) => {
    locationContextValue = value;
    return children;
  },
}));

jest.mock("../components/Layout/pre-fetch-experiences", () => ({
  preFetchExperiences: jest.fn(({ onDone }: PreFetchExperiencesFnArgs) => {
    onDone();
  }),
}));
const mockPrefetchExperiences = preFetchExperiences as jest.Mock;

////////////////////////// END MOCKS ////////////////////////////

const browserRenderedUiId = "layout-loaded";

describe("components", () => {
  beforeEach(() => {
    jest.useFakeTimers();

    mockOfflineItemsCount.mockReset();
    mockUseUser.mockReset();
    mockIsConnected.mockReset();
    mockPrefetchExperiences.mockReset();
    locationContextValue = null;
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  it("renders children in ssr", () => {
    /**
     * Given component was rendered with empty context
     */
    const testId = "ssr-loaded";
    const { ui } = makeComp({
      context: {
        cache: null,
        restoreCacheOrPurgeStorage: null,
        client: null,
      },
      testId,
    });

    render(ui);

    /**
     * Then its server rendered children should be loaded
     */
    expect(document.getElementById(testId)).not.toBeNull();

    /**
     * And we should not see browser hydrated children
     */
    expect(document.getElementById(browserRenderedUiId)).toBeNull();
  });

  it("renders loading and then main component", async () => {
    const { ui } = makeComp();

    /**
     * Given component was rendered with all context props
     */
    render(ui);

    /**
     * Then we should not see component's children
     */

    expect(document.getElementById(browserRenderedUiId)).toBeNull();

    /**
     * But we should see loading indicator
     */
    expect(document.getElementById("o-o-1")).not.toBeNull();

    /**
     * And location context should not be set
     */

    expect(locationContextValue).toBeNull();

    /**
     * After some pause
     */

    const $elm = await waitForElement(() => {
      return document.getElementById(browserRenderedUiId);
    });

    /**
     * Then we should no longer see component's children
     */

    expect($elm).not.toBeNull();

    /**
     * And we should not see loading indicator
     */
    expect(document.getElementById("o-o-1")).toBeNull();

    /**
     * And location context should have been set
     */
    expect(locationContextValue).toMatchObject({});
  });

  it("renders browser hydrated children if cache persist succeeds", async () => {
    /**
     * Given component was rendered with all context props
     */
    const { ui, mockRestoreCacheOrPurgeStorage } = makeComp();

    mockRestoreCacheOrPurgeStorage.mockResolvedValue({});

    render(ui);

    /**
     * Then we should see component's children
     */
    const $elm = await waitForElement(() =>
      document.getElementById(browserRenderedUiId),
    );

    expect($elm).not.toBeNull();

    /**
     * And we should not see loading indicator
     */
    expect(document.getElementById("o-o-1")).toBeNull();
  });

  it("renders browser hydrated children if cache persist fails", async () => {
    /**
     * Given component was rendered with all context props
     */
    const { ui, mockRestoreCacheOrPurgeStorage } = makeComp();

    mockRestoreCacheOrPurgeStorage.mockRejectedValue({});

    render(ui);

    /**
     * Then we should see component's children
     */
    const $elm = await waitForElement(() =>
      document.getElementById(browserRenderedUiId),
    );

    expect($elm).not.toBeNull();

    /**
     * And we should not see loading indicator
     */
    expect(document.getElementById("o-o-1")).toBeNull();
  });

  it("queries unsaved when there is user and connection", async () => {
    const { ui } = makeComp();
    mockUseUser.mockReturnValue({});
    mockIsConnected.mockReturnValue(true);

    render(ui);

    /**
     * When children are done rendering
     */
    await waitForElement(() => document.getElementById(browserRenderedUiId));

    /**
     * Then component should query for unsaved data
     */
    expect(mockOfflineItemsCount).toHaveBeenCalled();
  });

  it("queries unsaved when connection returns", async () => {
    /**
     * Given there is user in the system and initially there is no connection
     */
    const { ui, emitData } = makeComp({
      context: {
        connectionStatus: {
          isConnected: false,
        },
      },
    });

    mockUseUser.mockReturnValue({});
    mockOfflineItemsCount.mockReturnValue(5);
    mockIsConnected.mockReturnValue(false);

    expect(layoutContextValue).toBeNull();
    let context1: ILayoutContextHeaderValue;

    render(ui);

    /**
     * When children are done rendering
     */
    await waitForElement(() => document.getElementById(browserRenderedUiId));

    /**
     * Then we should not have a connection
     */

    context1 = layoutContextValue as ILayoutContextHeaderValue;
    expect(context1.hasConnection).toBe(false);

    /**
     * And we should not have queried for unsaved data
     */

    expect(context1.offlineItemsCount).toBe(null);

    /**
     * When connection event occurs
     */

    act(() => {
      emitData({
        type: EmitActionType.connectionChanged,
        hasConnection: true,
      });
    });

    /**
     * Then component should query for unsaved data after some pause
     */
    context1 = layoutContextValue as ILayoutContextHeaderValue;

    expect(context1.offlineItemsCount).toBe(5);

    /**
     * And set connection status to true
     */

    expect(context1.hasConnection).toBe(true);

    /**
     * When a random event occurs
     */

    let context2 = {} as ILayoutContextHeaderValue;

    emitData({
      type: EmitActionType.random,
    });

    /**
     * Then nothing should have changed
     */

    context2 = layoutContextValue as ILayoutContextHeaderValue;
    expect(context2).toBe(context1);
    expect(context2.offlineItemsCount).toBe(5);
  });

  test("sets unsaved count to 0 if we lose connection", async () => {
    const { ui, emitData } = makeComp();
    mockUseUser.mockReturnValue({});
    mockIsConnected.mockReturnValue(true);
    mockOfflineItemsCount.mockReturnValue(2);

    /**
     * Given the component is rendered
     */

    render(ui);

    let context = layoutContextValue as ILayoutContextHeaderValue;

    /**
     * Then we should not query for unsaved data in the beginning
     */

    expect(context).toBeNull();

    /**
     * When main component is rendered
     */

    await waitForElement(() => {
      return document.getElementById(browserRenderedUiId);
    });

    context = layoutContextValue as ILayoutContextHeaderValue;

    /**
     * Then we should query for unsaved data
     */

    expect(context.offlineItemsCount).toBe(2);

    /**
     * When disconnect event occurs
     */

    act(() => {
      emitData({
        type: EmitActionType.connectionChanged,
        hasConnection: false,
      });
    });

    context = layoutContextValue as ILayoutContextHeaderValue;

    /**
     * Then we should reset unsaved data count
     */

    expect(context.offlineItemsCount).toBe(0);
  });

  test("pre-fetches experiences - initially connected", async () => {
    const childProps = {} as FetchExperienceInstructorProps["props"];

    const { ui } = makeComp({
      props: {
        children: <FetchExperienceInstructorComponent props={childProps} />,
      },
    });

    let context = layoutExperienceContextValue as ILayoutContextExperienceValue;

    expect(context).toBeNull();

    /**
     * Given there is logged in user
     */

    mockUseUser.mockReturnValue({});

    /**
     * And there are experiences to prefetch in the system
     */

    const ids = ["1"];

    /**
     * And we are connected
     */

    mockIsConnected.mockReturnValue(true);

    /**
     * And component is rendered
     */

    render(ui);

    /**
     * And child component is rendered
     */

    await waitForElement(() => document.getElementById(browserRenderedUiId));

    /**
     * Then we should not fetch experiences because child component has not
     * issued instruction
     */

    expect(mockPrefetchExperiences).not.toHaveBeenCalled();

    /**
     * When child component signals it wishes to pre fetch experiences
     */

    childProps.onClick = () => {
      layoutDispatch({
        type: LayoutActionType.EXPERIENCES_TO_PREFETCH,
        ids,
      });
    };

    const $child = document.getElementById("layout-child") as HTMLDivElement;
    $child.click();
    await wait(() => true);
    jest.runAllTimers();

    /**
     * Then we should have pre fetched experiences
     */

    const preFetchExperiencesArgs = mockPrefetchExperiences.mock
      .calls[0][0] as PreFetchExperiencesFnArgs;

    expect(preFetchExperiencesArgs.ids[0]).toEqual("1");

    /**
     * When we are done pre fetching experiences
     */

    await wait(() => {
      preFetchExperiencesArgs.onDone();
    });
    /**
     * Then we should indicate so
     */

    context = layoutExperienceContextValue as ILayoutContextExperienceValue;

    expect(context.fetchExperience).toEqual("already-fetched");
  });

  test("pre-fetches experiences - initially disconnected", async () => {
    /**
     * Given component has a child that wishes to pre fetch experiences
     */

    const childProps = {} as FetchExperienceInstructorProps["props"];
    const children = <FetchExperienceInstructorComponent props={childProps} />;

    /**
     * And we are initially disconnected
     */
    mockIsConnected.mockReturnValue(false);

    const connectionStatus = {
      isConnected: false,
    };

    /**
     * And user is logged in
     */

    mockUseUser.mockReturnValue({});

    /**
     * And there unsaved data in the system
     */

    mockOfflineItemsCount.mockResolvedValue(2);

    const { ui, emitData } = makeComp({
      props: {
        children,
      },

      context: {
        connectionStatus,
      },
    });

    /**
     * When component is rendered
     */

    render(ui);

    /**
     * And component's children have rendered
     */

    await waitForElement(() => document.getElementById(browserRenderedUiId));

    /**
     * Then we should not have pre fetched experiences
     */

    expect(mockPrefetchExperiences).not.toHaveBeenCalled();

    /**
     * When child gives instruction to fetch experiences
     */

    childProps.onClick = () => {
      layoutDispatch({
        type: LayoutActionType.EXPERIENCES_TO_PREFETCH,
        ids: ["1"],
      });
    };

    const $child = document.getElementById("layout-child") as HTMLDivElement;
    $child.click();

    /**
     * Then we should still not fetch experiences - because we not connected
     */

    expect(mockPrefetchExperiences).not.toHaveBeenCalled();

    /**
     * When connection event occurs
     */

    act(() => {
      emitData({
        type: EmitActionType.connectionChanged,
        hasConnection: true,
      });
    });

    /**
     * Then we should fetch experiences
     */

    await wait(() => true);
    jest.runAllTimers();

    const preFetchExperiencesArgs = mockPrefetchExperiences.mock
      .calls[0][0] as PreFetchExperiencesFnArgs;

    expect(preFetchExperiencesArgs.ids[0]).toEqual("1");
  });

  test("n", async () => {
    const { ui, emitData } = makeComp();
    mockUseUser.mockReturnValue({});
    mockIsConnected.mockReturnValue(true);
    mockOfflineItemsCount.mockReturnValue(2);

    /**
     * Given the component is rendered
     */

    render(ui);

    let context = layoutContextValue as ILayoutContextHeaderValue;

    /**
     * Then we should not query for unsaved data in the beginning
     */

    expect(context).toBeNull();

    /**
     * When main component is rendered
     */

    await waitForElement(() => {
      return document.getElementById(browserRenderedUiId);
    });

    context = layoutContextValue as ILayoutContextHeaderValue;

    /**
     * Then we should query for unsaved data
     */

    expect(context.offlineItemsCount).toBe(2);

    /**
     * When disconnect event occurs
     */

    act(() => {
      emitData({
        type: EmitActionType.connectionChanged,
        hasConnection: false,
      });
    });

    await wait(() => {
      context = layoutContextValue as ILayoutContextHeaderValue;
    });

    /**
     * Then we should reset unsaved data count
     */

    expect(context.offlineItemsCount).toBe(0);
  });
});

describe("reducer", () => {
  test("experiences to prefetch - set to never fetch if no user", () => {
    const state = initState(({
      connectionStatus: false,
    } as unknown) as InitStateArgs);
    state.states.prefetchExperiences.value = StateValue.prefetchValFetchNow;

    const action = {
      type: LayoutActionType.EXPERIENCES_TO_PREFETCH,
      ids: ["1"],
    } as LayoutAction;

    const nextState = reducer(state, action);
    expect(nextState.states.prefetchExperiences.value).toEqual("never-fetched");
  });

  test("experiences to prefetch - set to never fetch if ids is null", () => {
    const state = initState(({
      connectionStatus: false,
      user: {},
    } as unknown) as InitStateArgs);

    state.states.prefetchExperiences.value = StateValue.prefetchValFetchNow;

    const action = {
      type: LayoutActionType.EXPERIENCES_TO_PREFETCH,
      ids: null,
    } as LayoutAction;

    const nextState = reducer(state, action);
    expect(nextState.states.prefetchExperiences.value).toEqual("never-fetched");
  });

  test("experiences to prefetch - set to never fetch if ids is empty array", () => {
    const state = initState(({
      connectionStatus: false,
      user: {},
    } as unknown) as InitStateArgs);

    state.states.prefetchExperiences.value = StateValue.prefetchValFetchNow;

    const action = {
      type: LayoutActionType.EXPERIENCES_TO_PREFETCH,
      ids: [],
    } as LayoutAction;

    const nextState = reducer(state, action);
    expect(nextState.states.prefetchExperiences.value).toEqual("never-fetched");
  });

  test("experiences to prefetch - don't touch on connection changed if no user", () => {
    /**
     * Given we have never fetched experiences and there is no user
     */

    const state = initState(({
      connectionStatus: false,
    } as unknown) as InitStateArgs);

    state.states.prefetchExperiences.value = StateValue.prefetchValNeverFetched;

    /**
     * When connection changes
     */

    const action = {
      type: LayoutActionType.CONNECTION_CHANGED,
      isConnected: true,
      offlineItemsCount: 5,
    } as LayoutAction;

    const nextState = reducer(state, action);

    /**
     * Then experiences is still never fetched
     */

    expect(nextState.states.prefetchExperiences.value).toEqual("never-fetched");
  });

  test("sets unsaved count", () => {
    /**
     * Given we have some unsaved data
     */

    const state = initState(({
      connectionStatus: false,
    } as unknown) as InitStateArgs);

    state.context.offlineItemsCount = 5;

    /**
     * When we update count of unsaved data
     */

    const action = {
      type: LayoutActionType.SET_OFFLINE_ITEMS_COUNT,
      count: 17,
    } as LayoutAction;

    const nextState = reducer(state, action);

    /**
     * Then the count should reflect new value
     */

    expect(nextState.context.offlineItemsCount).toBe(17);
  });
});

////////////////////////// HELPER FUNCTIONS ///////////////////////////////////

const LayoutP = Layout as ComponentType<Partial<Props>>;

function makeComp({
  context = {},
  testId = browserRenderedUiId,
  props = {},
}: {
  context?: {};
  testId?: string;
  props?: Partial<Props>;
} = {}) {
  layoutContextValue = null;
  layoutExperienceContextValue = null;

  const mockRestoreCacheOrPurgeStorage = jest.fn();
  const cache = { readQuery: jest.fn() };
  const client = { query: jest.fn };

  const defaultContext = {
    restoreCacheOrPurgeStorage: mockRestoreCacheOrPurgeStorage,
    cache,
    client,
    connectionStatus: {
      isConnected: true,
      mode: "auto",
    },
  };

  const globals = {} as E2EWindowObject;
  const observableUtils = makeObservable(globals);
  context = { ...defaultContext, ...observableUtils, ...context };

  return {
    ui: (
      <EbnisAppProvider value={context as EbnisContextProps}>
        <LayoutP location={{} as any}>
          <div id={testId} />
          {props.children}
        </LayoutP>
      </EbnisAppProvider>
    ),

    mockRestoreCacheOrPurgeStorage,
    emitData: observableUtils.emitData,
  };
}

function FetchExperienceInstructorComponent(
  props: FetchExperienceInstructorProps,
) {
  return (
    <div>
      <span
        id="layout-child"
        onClick={() => {
          props.props.onClick();
        }}
      >
        1
      </span>
    </div>
  );
}

interface FetchExperienceInstructorProps {
  props: {
    onClick: () => void;
  };
}

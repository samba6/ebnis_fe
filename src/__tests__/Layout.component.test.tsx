/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { ComponentType } from "react";
import "@marko/testing-library/cleanup-after-each";
import { render, waitForElement, wait } from "@testing-library/react";
import { Layout } from "../components/Layout/layout.component";
import { EbnisAppProvider, EbnisContextProps } from "../context";
import { EmitActionType, makeObservable } from "../state/observable-manager";
import {
  LayoutContextValue,
  Props,
  LayoutActionType,
  reducer,
  LayoutAction,
  initState,
  StateValue,
  InitStateArgs,
  effectFunctions,
  EffectState,
} from "../components/Layout/layout.utils";
import { getOfflineItemsCount } from "../state/offline-resolvers";
import { isConnected } from "../state/connections";
import { useUser } from "../components/use-user";
import { E2EWindowObject } from "../state/apollo-setup";
import { WindowLocation } from "@reach/router";
import { act } from "react-dom/test-utils";
import {
  cleanupObservableSubscription,
  preFetchExperiences,
  PreFetchExperiencesFnArgs,
} from "../components/Layout/layout-injectables";

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

let layoutContextValue: null | LayoutContextValue;
let locationContextValue: null | WindowLocation;

jest.mock("../components/Layout/layout-providers", () => ({
  LayoutProvider: ({ children, value }: any) => {
    layoutContextValue = value;

    return <>{children}</>;
    return children;
  },

  LayoutUnchangingProvider: ({ children }: any) => {
    return children;
  },

  LayoutExperienceProvider: ({ children }: any) => {
    return children;
  },

  LocationProvider: ({ children, value }: any) => {
    locationContextValue = value;
    return children;
  },
}));

jest.mock("../components/Layout/layout-injectables", () => ({
  preFetchExperiences: jest.fn(({ onDone }: PreFetchExperiencesFnArgs) => {
    onDone();
  }),

  cleanupObservableSubscription: jest.fn(),
}));
const mockPrefetchExperiences = preFetchExperiences as jest.Mock;
const mockCleanupObservableSubscription = cleanupObservableSubscription as jest.Mock;

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
    mockCleanupObservableSubscription.mockReset();
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
    const { unmount } = render(ui);

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

    /**
     * And cleanup codes should not have ran
     */

    expect(mockCleanupObservableSubscription).not.toHaveBeenCalled();

    /**
     * When component unmounts
     */
    unmount();

    /**
     * Then cleanup codes should run
     */
    expect(mockCleanupObservableSubscription).toHaveBeenCalledTimes(1);
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
    let context1: LayoutContextValue;

    render(ui);

    /**
     * When children are done rendering
     */
    await waitForElement(() => document.getElementById(browserRenderedUiId));

    /**
     * Then we should not have a connection
     */

    context1 = layoutContextValue as LayoutContextValue;
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
    context1 = layoutContextValue as LayoutContextValue;

    expect(context1.offlineItemsCount).toBe(5);

    /**
     * And set connection status to true
     */

    expect(context1.hasConnection).toBe(true);

    /**
     * When a random event occurs
     */

    let context2 = {} as LayoutContextValue;

    emitData({
      type: EmitActionType.random,
    });

    /**
     * Then nothing should have changed
     */

    context2 = layoutContextValue as LayoutContextValue;
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

    let context = layoutContextValue as LayoutContextValue;

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

    context = layoutContextValue as LayoutContextValue;

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

    context = layoutContextValue as LayoutContextValue;

    /**
     * Then we should reset unsaved data count
     */

    expect(context.offlineItemsCount).toBe(0);
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

    let context = layoutContextValue as LayoutContextValue;

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

    context = layoutContextValue as LayoutContextValue;

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
      context = layoutContextValue as LayoutContextValue;
    });

    /**
     * Then we should reset unsaved data count
     */

    expect(context.offlineItemsCount).toBe(0);
  });
});

describe("reducer", () => {
  test("CONNECTION_CHANGED: no connection", () => {
    const state = initState({
      connectionStatus: { isConnected: true },
    } as InitStateArgs);

    const action = {
      type: LayoutActionType.CONNECTION_CHANGED,
      isConnected: false,
    } as LayoutAction;

    expect(state.context).toMatchObject({
      hasConnection: true,
      offlineItemsCount: null,
    });

    const nextState = reducer(state, action);

    expect(nextState.context).toMatchObject({
      hasConnection: false,
      offlineItemsCount: 0,
    });

    expect(nextState.effects.runOnRenders.value).toBe(StateValue.noEffect);
  });

  test("CONNECTION_CHANGED: has connection, no user", () => {
    const state = initState({
      connectionStatus: { isConnected: false },
    } as InitStateArgs);

    expect(state.context).toMatchObject({
      hasConnection: false,
    });

    const action = {
      type: LayoutActionType.CONNECTION_CHANGED,
      isConnected: true,
    } as LayoutAction;

    const nextState = reducer(state, action);

    expect(nextState.context).toMatchObject({
      hasConnection: true,
    });

    expect(nextState.effects.runOnRenders.value).toBe(StateValue.noEffect);
  });

  test("CONNECTION_CHANGED: has connection and user", () => {
    const state = initState({
      connectionStatus: { isConnected: false },
      user: {},
    } as InitStateArgs);

    expect(state.context).toMatchObject({
      hasConnection: false,
    });

    const action = {
      type: LayoutActionType.CONNECTION_CHANGED,
      isConnected: true,
    } as LayoutAction;

    const nextState = reducer(state, action);

    expect(nextState.context).toMatchObject({
      hasConnection: true,
    });

    const { value, hasEffects } = nextState.effects.runOnRenders as EffectState;
    expect(value).toBe(StateValue.hasEffects);
    const effectKeys = hasEffects.context.effects.map(e => e.key);

    expect(effectKeys).toContain(StateValue.prefetchExperiences);
    expect(effectKeys).toContain(StateValue.getOfflineItemsCount);
  });

  test("CACHE_PERSISTED: has connection but already pre-fetched experiencess", () => {
    const state = initState({
      connectionStatus: { isConnected: false },
      user: {},
    } as InitStateArgs);

    state.states.prefetchExperiences.value = StateValue.alreadyFetched;

    expect(state.context).toMatchObject({
      hasConnection: false,
    });

    const action = {
      type: LayoutActionType.CACHE_PERSISTED,
      hasConnection: true,
    } as LayoutAction;

    const nextState = reducer(state, action);

    expect(nextState.context).toMatchObject({
      hasConnection: true,
    });

    const { value, hasEffects } = nextState.effects.runOnRenders as EffectState;
    expect(value).toBe(StateValue.hasEffects);
    const effectKeys = hasEffects.context.effects.map(e => e.key);

    expect(effectKeys).not.toContain(StateValue.prefetchExperiences);
    expect(effectKeys).toContain(StateValue.getOfflineItemsCount);
  });

  test("sets unsaved count", () => {
    /**
     * Given we have some unsaved data
     */

    const state = initState({
      connectionStatus: { isConnected: false },
    } as InitStateArgs);

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

  it("does not refetch offline items count when no connection", () => {
    const state = initState({
      connectionStatus: {},
    } as InitStateArgs);

    const action = {
      type: LayoutActionType.REFETCH_OFFLINE_ITEMS_COUNT,
    } as LayoutAction;

    const nextState = reducer(state, action);

    expect(state).toEqual(nextState);
  });

  it("refetches offline items count when there is connection", () => {
    const state = initState({
      connectionStatus: { isConnected: true },
    } as InitStateArgs);

    const action = {
      type: LayoutActionType.REFETCH_OFFLINE_ITEMS_COUNT,
    } as LayoutAction;

    const nextState = reducer(state, action);

    expect(state.effects.runOnRenders.value).toEqual(StateValue.noEffect);

    const {
      effects: { runOnRenders },
    } = nextState;

    expect(runOnRenders.value).toEqual(StateValue.hasEffects);

    const [effect] = (runOnRenders as EffectState).hasEffects.context.effects;
    const mockDispatch = jest.fn();
    mockOfflineItemsCount.mockReturnValue(1);
    effectFunctions[effect.key]({} as any, {} as any, {
      dispatch: mockDispatch,
    });
    expect(mockDispatch).toHaveBeenCalledWith({
      type: LayoutActionType.SET_OFFLINE_ITEMS_COUNT,
      count: 1,
    });
  });
});

////////////////////////// HELPER FUNCTIONS ///////////////////////////////////

const LayoutP = Layout as ComponentType<Partial<Props>>;

function makeComp({
  context = {},
  testId = browserRenderedUiId,
}: {
  context?: {};
  testId?: string;
} = {}) {
  layoutContextValue = null;

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
        </LayoutP>
      </EbnisAppProvider>
    ),

    mockRestoreCacheOrPurgeStorage,
    emitData: observableUtils.emitData,
  };
}

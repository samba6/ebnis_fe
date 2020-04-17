/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { ComponentType } from "react";
import "@marko/testing-library/cleanup-after-each";
import { render, waitForElement } from "@testing-library/react";
import { Layout } from "../components/Layout/layout.component";
import { EbnisAppProvider, EbnisContextProps } from "../context";
import { makeObservable } from "../state/observable-manager";
import {
  Props,
  LayoutActionType,
  reducer,
  LayoutAction,
  initState,
  StateValue,
  InitStateArgs,
  EffectState,
} from "../components/Layout/layout.utils";
import { isConnected } from "../state/connections";
import { useUser } from "../components/use-user";
import { E2EWindowObject } from "../state/apollo-setup";
import { WindowLocation } from "@reach/router";
import {
  cleanupObservableSubscription,
  preFetchExperiences,
  PreFetchExperiencesFnArgs,
} from "../components/Layout/layout-injectables";

////////////////////////// MOCKS ////////////////////////////

jest.mock("../state/connections");
const mockIsConnected = isConnected as jest.Mock;

jest.mock("../components/Loading/loading", () => ({
  Loading: () => <div id="o-o-1" />,
}));

jest.mock("../components/use-user");
const mockUseUser = useUser as jest.Mock;

let locationContextValue: null | WindowLocation;

jest.mock("../components/Layout/layout-providers", () => ({
  LayoutProvider: ({ children }: any) => {
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
    });

    const nextState = reducer(state, action);

    expect(nextState.context).toMatchObject({
      hasConnection: false,
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
  });

  test("CACHE_PERSISTED: has connection but already pre-fetched experiences", () => {
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

/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { ComponentType } from "react";
import "react-testing-library/cleanup-after-each";
import { render, waitForElement, wait } from "react-testing-library";
import { Layout } from "../components/Layout/layout.component";
import { EbnisAppProvider, EbnisContextProps } from "../context";
import { EmitActionType, makeObservable } from "../setup-observable";
import {
  ILayoutContextContextValue,
  Props,
  LayoutActionType,
  StateMachine,
  reducer,
  LayoutAction,
} from "../components/Layout/layout.utils";

////////////////////////// MOCKS ////////////////////////////

jest.mock("../state/unsaved-resolvers");
import { getUnsavedCount } from "../state/unsaved-resolvers";
const mockGetUnsavedCount = getUnsavedCount as jest.Mock;

jest.mock("../state/connections");
import { isConnected } from "../state/connections";
const mockIsConnected = isConnected as jest.Mock;

jest.mock("../components/Loading/loading", () => ({
  Loading: () => <div id="o-o-1" />,
}));

jest.mock("../components/use-user");
import { useUser } from "../components/use-user";
import { E2EWindowObject } from "../state/apollo-setup";
const mockUseUser = useUser as jest.Mock;

let layoutContextValue: null | ILayoutContextContextValue;

jest.mock("../components/Layout/layout-provider", () => ({
  LayoutProvider: ({ children, ...props }: any) => {
    layoutContextValue = props.value;

    return <>{children}</>;
  },
}));

jest.mock("../components/Layout/pre-fetch-experiences", () => ({
  preFetchExperiences: jest.fn(({ onDone }: PreFetchExperiencesFnArgs) => {
    onDone();
  }),
}));

import {
  preFetchExperiences,
  PreFetchExperiencesFnArgs,
} from "../components/Layout/pre-fetch-experiences";

const mockPrefetchExperiences = preFetchExperiences as jest.Mock;

////////////////////////// END MOCKS ////////////////////////////

const browserRenderedUiId = "layout-loaded";

describe("components", () => {
  beforeEach(() => {
    jest.useFakeTimers();
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

  it("renders loading", () => {
    /**
     * Given component was rendered with all context props
     */
    const { ui } = makeComp();

    render(ui);

    /**
     * Then we should see loading indicator
     */
    expect(document.getElementById("o-o-1")).not.toBeNull();

    /**
     * And we should not see component's children
     */
    expect(document.getElementById(browserRenderedUiId)).toBeNull();
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
    expect(mockGetUnsavedCount).toHaveBeenCalled();
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
    mockGetUnsavedCount.mockResolvedValue(5);
    mockIsConnected.mockReturnValue(false);

    expect(layoutContextValue).toBeNull();
    let contextValue = {} as ILayoutContextContextValue;

    render(ui);

    /**
     * When children are done rendering
     */
    await waitForElement(() => document.getElementById(browserRenderedUiId));

    contextValue = layoutContextValue as ILayoutContextContextValue;
    expect(contextValue.unsavedCount).toBe(null);
    expect(contextValue.hasConnection).toBe(false);

    /**
     * And connection returns and we are reconnecting
     */
    emitData({
      type: EmitActionType.connectionChanged,
      hasConnection: true,
    });

    /**
     * Then component should query for unsaved data
     */
    await wait(() => {
      contextValue = layoutContextValue as ILayoutContextContextValue;
      expect(contextValue.unsavedCount).toBe(5);
    });

    expect(contextValue.hasConnection).toBe(true);

    emitData({
      type: EmitActionType.nothing,
    });

    await wait(() => {
      contextValue = layoutContextValue as ILayoutContextContextValue;
      expect(contextValue.hasConnection).toBe(true);
    });
  });

  test("sets unsaved count to 0 if we lose connection", async () => {
    const { ui, emitData } = makeComp();
    mockUseUser.mockReturnValue({});
    mockIsConnected.mockReturnValue(true);
    mockGetUnsavedCount.mockResolvedValue(2);

    expect(layoutContextValue).toBeNull();

    render(ui);

    await waitForElement(() => document.getElementById(browserRenderedUiId));

    let context = layoutContextValue as ILayoutContextContextValue;
    expect(context.unsavedCount).toBe(2);

    context.layoutDispatch({
      type: LayoutActionType.EXPERIENCES_TO_PREFETCH,
      ids: ["1"],
    });

    emitData({
      type: EmitActionType.connectionChanged,
      hasConnection: false,
    });

    context = layoutContextValue as ILayoutContextContextValue;
    expect(context.unsavedCount).toBe(0);
  });

  test("pre-fetches experiences - initially connected", async () => {
    const childProps = {} as LayoutChildProps["props"];

    const { ui } = makeComp({
      props: {
        children: <LayoutChild props={childProps} />,
      },
    });

    mockUseUser.mockReturnValue({});
    mockIsConnected.mockReturnValue(true);

    render(ui);

    await waitForElement(() => document.getElementById(browserRenderedUiId));

    let context = layoutContextValue as ILayoutContextContextValue;

    childProps.onClick = () => {
      context.layoutDispatch({
        type: LayoutActionType.EXPERIENCES_TO_PREFETCH,
        ids: ["1"],
      });
    };

    expect(mockPrefetchExperiences).not.toHaveBeenCalled();

    const $child = document.getElementById("layout-child") as HTMLDivElement;
    $child.click();
    jest.runAllTimers();

    const preFetchExperiencesArgs = mockPrefetchExperiences.mock
      .calls[0][0] as PreFetchExperiencesFnArgs;

    expect(preFetchExperiencesArgs.ids[0]).toEqual("1");
    preFetchExperiencesArgs.onDone();
  });

  test("pre-fetches experiences - initially disconnected", async () => {
    const childProps = {} as LayoutChildProps["props"];

    const { ui, emitData } = makeComp({
      props: {
        children: <LayoutChild props={childProps} />,
      },

      context: {
        connectionStatus: {
          isConnected: false,
        },
      },
    });

    mockUseUser.mockReturnValue({});
    mockIsConnected.mockReturnValue(false);
    mockGetUnsavedCount.mockResolvedValue(2);

    render(ui);

    await waitForElement(() => document.getElementById(browserRenderedUiId));

    let context = layoutContextValue as ILayoutContextContextValue;

    childProps.onClick = () => {
      context.layoutDispatch({
        type: LayoutActionType.EXPERIENCES_TO_PREFETCH,
        ids: ["1"],
      });
    };

    expect(mockPrefetchExperiences).not.toHaveBeenCalled();

    const $child = document.getElementById("layout-child") as HTMLDivElement;
    $child.click();
    jest.runAllTimers();

    expect(mockPrefetchExperiences).not.toHaveBeenCalled();
    emitData({
      type: EmitActionType.connectionChanged,
      hasConnection: true,
    });

    await wait(() => {
      jest.runAllTimers();
      const preFetchExperiencesArgs = mockPrefetchExperiences.mock
        .calls[0][0] as PreFetchExperiencesFnArgs;

      expect(preFetchExperiencesArgs.ids[0]).toEqual("1");
    });
  });
});

describe("reducer", () => {
  test("experiences to prefetch - set to never fetch if no user", () => {
    const state = {
      states: {
        prefetchExperiences: {
          value: "fetch-now",
        },
      },

      context: {
        user: null,
      },
    } as StateMachine;

    const action = {
      type: LayoutActionType.EXPERIENCES_TO_PREFETCH,
      ids: ["1"],
    } as LayoutAction;

    const nextState = reducer(state, action);
    expect(nextState.states.prefetchExperiences.value).toEqual("never-fetched");
  });

  test("experiences to prefetch - set to never fetch if ids is null", () => {
    const state = {
      states: {
        prefetchExperiences: {
          value: "fetch-now",
        },
      },

      context: {
        user: {},
      },
    } as StateMachine;

    const action = {
      type: LayoutActionType.EXPERIENCES_TO_PREFETCH,
      ids: null,
    } as LayoutAction;

    const nextState = reducer(state, action);
    expect(nextState.states.prefetchExperiences.value).toEqual("never-fetched");
  });

  test("experiences to prefetch - set to never fetch if ids is empty array", () => {
    const state = {
      states: {
        prefetchExperiences: {
          value: "fetch-now",
        },
      },

      context: {
        user: {},
      },
    } as StateMachine;

    const action = {
      type: LayoutActionType.EXPERIENCES_TO_PREFETCH,
      ids: [],
    } as LayoutAction;

    const nextState = reducer(state, action);
    expect(nextState.states.prefetchExperiences.value).toEqual("never-fetched");
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
  mockGetUnsavedCount.mockReset();
  mockUseUser.mockReset();
  mockIsConnected.mockReset();
  mockPrefetchExperiences.mockReset();

  const mockRestoreCacheOrPurgeStorage = jest.fn();
  const cache = jest.fn();
  const mockQuery = jest.fn();
  const client = { query: mockQuery };

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

function LayoutChild(props: LayoutChildProps) {
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

interface LayoutChildProps {
  props: {
    onClick: () => void;
  };
}

/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { ComponentType } from "react";
import "react-testing-library/cleanup-after-each";
import { render, waitForElement, wait } from "react-testing-library";
import { Layout } from "../components/Layout/layout.component";
import { EbnisAppProvider, EbnisContextProps } from "../context";
import { emitData, EmitAction } from "../setup-observable";
import {
  ILayoutContextContext,
  Props,
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
const mockUseUser = useUser as jest.Mock;

let layoutContextValue = (null as unknown) as ILayoutContextContext;

jest.mock("../components/Layout/layout-provider", () => ({
  LayoutProvider: ({ children, ...props }: any) => {
    layoutContextValue = props.value;

    return <>{children}</>;
  },
}));

////////////////////////// END MOCKS ////////////////////////////

const browserRenderedUiId = "layout-loaded";

it("renders children in ssr", () => {
  /**
   * Given component was rendered with empty context
   */
  const testId = "ssr-loaded";
  const { ui } = makeComp({ context: {}, testId });

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
  const { ui } = makeComp();
  mockUseUser.mockReturnValue({});
  mockGetUnsavedCount.mockResolvedValue(5);
  mockIsConnected.mockResolvedValue(false);

  render(ui);

  /**
   * When children are done rendering
   */
  await waitForElement(() => document.getElementById(browserRenderedUiId));

  expect(layoutContextValue.unsavedCount).toBe(null);

  /**
   * And connection returns and we are reconnecting
   */
  emitData([EmitAction.connectionChanged, true]);

  /**
   * Then component should query for unsaved data
   */
  await wait(() => {
    expect(layoutContextValue.unsavedCount).toBe(5);
  });
});

it("resets unsaved count when we lose connection", async () => {
  const { ui } = makeComp();
  mockUseUser.mockReturnValue({});
  mockIsConnected.mockResolvedValue(true);
  mockGetUnsavedCount.mockResolvedValue(2);

  render(ui);

  await waitForElement(() => document.getElementById(browserRenderedUiId));

  expect(layoutContextValue.unsavedCount).toBe(2);

  emitData([EmitAction.connectionChanged, false]);

  expect(layoutContextValue.unsavedCount).toBe(0);
});

////////////////////////// HELPER FUNCTIONS ///////////////////////////////////

const LayoutP = Layout as ComponentType<Partial<Props>>;

function makeComp({
  context,
  testId = browserRenderedUiId,
}: { context?: {}; testId?: string } = {}) {
  layoutContextValue = (null as unknown) as ILayoutContextContext;
  mockGetUnsavedCount.mockReset();
  mockUseUser.mockReset();
  mockIsConnected.mockReset();

  const mockRestoreCacheOrPurgeStorage = jest.fn();
  const cache = jest.fn();
  const mockQuery = jest.fn();
  const client = { query: mockQuery };

  context = context
    ? context
    : {
        restoreCacheOrPurgeStorage: mockRestoreCacheOrPurgeStorage,
        cache,
        client,
      };

  return {
    ui: (
      <EbnisAppProvider value={context as EbnisContextProps}>
        <LayoutP location={{} as any}>
          <div id={testId} />
        </LayoutP>
      </EbnisAppProvider>
    ),
    mockRestoreCacheOrPurgeStorage,
  };
}

/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { ComponentType } from "react";
import "jest-dom/extend-expect";
import "react-testing-library/cleanup-after-each";
import { render, waitForElement, wait } from "react-testing-library";
import { Layout, Props } from "../components/Layout/component";
import { EbnisAppProvider } from "../context";

jest.mock("../state/unsaved-resolvers");
jest.mock("../state/connections");
jest.mock("../components/Loading", () => ({
  Loading: jest.fn(() => <div data-testid="loading" />),
}));
jest.mock("../components/use-user");

let layoutContextValue = (null as unknown) as ILayoutContextContext;

jest.mock("../components/Layout/layout-provider", () => ({
  LayoutProvider: jest.fn(({ children, ...props }) => {
    layoutContextValue = props.value;

    return <>{children}</>;
  }),
}));

import { getUnsavedCount } from "../state/unsaved-resolvers";
import { emitData, EmitAction } from "../setup-observable";
import { ILayoutContextContext } from "../components/Layout/utils";
import { useUser } from "../components/use-user";
import { isConnected } from "../state/connections";

const mockGetUnsavedCount = getUnsavedCount as jest.Mock;
const mockIsConnected = isConnected as jest.Mock;
const mockUseUser = useUser as jest.Mock;

const browserRenderedTestId = "layout-loaded";

it("renders children in ssr", () => {
  /**
   * Given component was rendered with empty context
   */
  const testId = "ssr-loaded";
  const { ui } = makeComp({ context: {}, testId });

  const { queryByTestId } = render(ui);

  /**
   * Then its server rendered children should be loaded
   */
  expect(queryByTestId(testId)).toBeInTheDocument();

  /**
   * And we should not see browser hydrated children
   */
  expect(queryByTestId(browserRenderedTestId)).not.toBeInTheDocument();
});

it("renders loading", () => {
  /**
   * Given component was rendered with all context props
   */
  const { ui } = makeComp();

  const { queryByTestId } = render(ui);

  /**
   * Then we should see loading indicator
   */
  expect(queryByTestId("loading")).toBeInTheDocument();

  /**
   * And we should not see component's children
   */
  expect(queryByTestId(browserRenderedTestId)).not.toBeInTheDocument();
});

it("renders browser hydrated children if cache persist succeeds", async done => {
  /**
   * Given component was rendered with all context props
   */
  const { ui, mockPersistCache } = makeComp();

  mockPersistCache.mockResolvedValue({});

  const { queryByTestId, getByTestId } = render(ui);

  /**
   * Then we should see component's children
   */
  const $elm = await waitForElement(() => getByTestId(browserRenderedTestId));
  expect($elm).toBeInTheDocument();

  /**
   * And we should not see loading indicator
   */
  expect(queryByTestId("loading")).not.toBeInTheDocument();

  done();
});

it("renders browser hydrated children if cache persist fails", async done => {
  /**
   * Given component was rendered with all context props
   */
  const { ui, mockPersistCache } = makeComp();

  mockPersistCache.mockRejectedValue({});

  const { queryByTestId, getByTestId } = render(ui);

  /**
   * Then we should see component's children
   */
  const $elm = await waitForElement(() => getByTestId(browserRenderedTestId));
  expect($elm).toBeInTheDocument();

  /**
   * And we should not see loading indicator
   */
  expect(queryByTestId("loading")).not.toBeInTheDocument();

  done();
});

it("queries unsaved when there is user and connection", async done => {
  const { ui } = makeComp();
  mockUseUser.mockReturnValue({});
  mockIsConnected.mockReturnValue(true);

  const { getByTestId } = render(ui);

  /**
   * When children are done rendering
   */
  await waitForElement(() => getByTestId(browserRenderedTestId));

  /**
   * Then component should query for unsaved data
   */
  expect(mockGetUnsavedCount).toHaveBeenCalled();

  done();
});

it("queries unsaved when connection returns", async done => {
  /**
   * Given there is user in the system and initially there is no connection
   */
  const { ui } = makeComp();
  mockUseUser.mockReturnValue({});
  mockGetUnsavedCount.mockResolvedValue(5);
  mockIsConnected.mockResolvedValue(false);

  const { getByTestId } = render(ui);

  /**
   * When children are done rendering
   */
  await waitForElement(() => getByTestId(browserRenderedTestId));

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

  done();
});

it("resets unsaved count when we lose connection", async done => {
  const { ui } = makeComp();
  mockUseUser.mockReturnValue({});
  mockIsConnected.mockResolvedValue(true);
  mockGetUnsavedCount.mockResolvedValue(2);

  const { getByTestId } = render(ui);

  await waitForElement(() => getByTestId(browserRenderedTestId));

  expect(layoutContextValue.unsavedCount).toBe(2);

  emitData([EmitAction.connectionChanged, false]);

  expect(layoutContextValue.unsavedCount).toBe(0);

  done();
});

////////////////////////// HELPER FUNCTIONS ///////////////////////////////////

const LayoutP = Layout as ComponentType<Partial<Props>>;

function makeComp({
  context,
  testId = browserRenderedTestId,
}: { context?: {}; testId?: string } = {}) {
  layoutContextValue = (null as unknown) as ILayoutContextContext;
  mockGetUnsavedCount.mockReset();
  mockUseUser.mockReset();
  mockIsConnected.mockReset();

  const mockPersistCache = jest.fn();
  const cache = jest.fn();
  const mockQuery = jest.fn();
  const client = { query: mockQuery };

  context = context
    ? context
    : { persistCache: mockPersistCache, cache, client };

  return {
    ui: (
      <EbnisAppProvider value={context}>
        <LayoutP location={{} as any}>
          <div data-testid={testId} />
        </LayoutP>
      </EbnisAppProvider>
    ),
    mockPersistCache,
  };
}

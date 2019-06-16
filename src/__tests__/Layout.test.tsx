// tslint:disable: no-any
import React, { ComponentType } from "react";
import "jest-dom/extend-expect";
import "react-testing-library/cleanup-after-each";
import { render, waitForElement, wait } from "react-testing-library";
import { Layout } from "../components/Layout/component";
import { EbnisAppProvider } from "../context";

jest.mock("../state/tokens");
jest.mock("../state/how_many_unsaved");
jest.mock("../state/get-conn-status");
jest.mock("../components/Loading", () => ({
  Loading: jest.fn(() => <div data-testid="loading" />)
}));

let layoutContextValue = (null as unknown) as ILayoutContextContext;

jest.mock("../components/Layout/utils", () => ({
  LayoutProvider: jest.fn(({ children, ...props }) => {
    layoutContextValue = props.value;

    return <>{children}</>;
  })
}));

import { getUser } from "../state/tokens";
import { howManyUnsaved } from "../state/how_many_unsaved";
import { getConnStatus } from "../state/get-conn-status";
import { emitData, EmitAction } from "../setup-observable";
import { ILayoutContextContext } from "../components/Layout/utils";

const mockGetUser = getUser as jest.Mock;
const mockHowManyUnsaved = howManyUnsaved as jest.Mock;
const mockGetConnStatus = getConnStatus as jest.Mock;

const LayoutP = Layout as ComponentType<{}>;
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

it("renders browser hydrated children if cache persist succeeds", async () => {
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
});

it("renders browser hydrated children if cache persist fails", async () => {
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
});

it("queries unsaved when there is user and connection", async () => {
  const { ui } = makeComp();
  mockGetUser.mockReturnValue({});
  mockGetConnStatus.mockResolvedValue(true);

  const { getByTestId } = render(ui);

  /**
   * When children are done rendering
   */
  await waitForElement(() => getByTestId(browserRenderedTestId));

  /**
   * Then component should query for unsaved data
   */
  expect(mockHowManyUnsaved).toHaveBeenCalled();
});

it("queries unsaved when connection returns and we are reconnecting", async done => {
  /**
   * Given there is user in the system and initially there is no connection
   */
  const { ui } = makeComp();
  mockGetUser.mockReturnValue({});
  mockHowManyUnsaved.mockResolvedValue(5);
  mockGetConnStatus.mockResolvedValue(false);

  const { getByTestId } = render(ui);

  /**
   * When children are done rendering
   */
  await waitForElement(() => getByTestId(browserRenderedTestId));

  expect(layoutContextValue.unsavedCount).toBe(0);

  /**
   * And connection returns and we are reconnecting
   */
  emitData({
    type: EmitAction.connectionChanged,
    data: { isConnected: true, reconnected: "true" } as any
  });

  /**
   * Then component should query for unsaved data
   */
  await wait(() => {
    expect(layoutContextValue.unsavedCount).toBe(5);
  });

  done();
});

it("does not query unsaved when connection returns and we are not reconnecting", async done => {
  /**
   * Given there is user in the system and initially there is no connection
   */
  const { ui } = makeComp();
  mockGetUser.mockReturnValue({});
  mockGetConnStatus.mockResolvedValue(false);

  const { getByTestId } = render(ui);

  /**
   * When children are done rendering
   */
  await waitForElement(() => getByTestId(browserRenderedTestId));

  /**
   * And connection returns and we are not reconnecting
   */
  emitData({
    type: EmitAction.connectionChanged,
    data: { isConnected: true, reconnected: "false" } as any
  });

  /**
   * Then component should not query for unsaved data
   */
  await wait(() => {
    expect(mockHowManyUnsaved).not.toHaveBeenCalled();
  });

  done();
});

it("resets unsaved count when we lose connection", async done => {
  const { ui } = makeComp();
  mockGetUser.mockReturnValue({});
  mockGetConnStatus.mockResolvedValue(true);
  mockHowManyUnsaved.mockResolvedValue(2);

  const { getByTestId } = render(ui);

  await waitForElement(() => getByTestId(browserRenderedTestId));

  expect(layoutContextValue.unsavedCount).toBe(2);

  emitData({
    type: EmitAction.connectionChanged,
    data: { isConnected: false } as any
  });

  expect(layoutContextValue.unsavedCount).toBe(0);

  done();
});

////////////////////////// HELPER FUNCTIONS ///////////////////////////////////

function makeComp({
  context,
  testId = browserRenderedTestId
}: { context?: {}; testId?: string } = {}) {
  layoutContextValue = (null as unknown) as ILayoutContextContext;
  mockHowManyUnsaved.mockReset();
  mockGetUser.mockReset();
  mockGetConnStatus.mockReset();

  // const persistor = jest.fn();
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
        <LayoutP>
          <div data-testid={testId} />
        </LayoutP>
      </EbnisAppProvider>
    ),
    mockPersistCache
  };
}

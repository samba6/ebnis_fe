/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { ComponentType } from "react";
import { render, cleanup } from "@testing-library/react";
import { Loading, LoadableLoading } from "../components/Loading/loading";
import { domPrefix } from "../components/Loading/loading-dom";
import { act } from "react-dom/test-utils";

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.clearAllTimers();
  cleanup();
});

it("does not render loading indicator", () => {
  const { ui } = makeComp({ props: { loading: false } });

  render(ui);
  jest.runAllTimers();
  expect(document.getElementById(domPrefix)).toBeNull();
});

it("renders loading indicator", () => {
  const { ui } = makeComp();

  render(ui);

  act(() => {
    jest.runAllTimers();
    const elm = document.getElementById(domPrefix) as HTMLElement;
    expect(elm).not.toBeNull();
    elm.click();
  });
});

it("renders LoadableLoading", () => {
  const props = {} as any;
  render(<LoadableLoading {...props} />);

  act(() => {
    jest.runAllTimers();
    expect(document.getElementById(domPrefix)).not.toBeNull();
  });
});

////////////////////////// HELPER FUNCTIONS ///////////////////////////

const LoadingP = Loading as ComponentType<Partial<{}>>;

function makeComp({ props = {} }: { props?: Partial<{}> } = {}) {
  return {
    ui: <LoadingP {...props} />,
  };
}

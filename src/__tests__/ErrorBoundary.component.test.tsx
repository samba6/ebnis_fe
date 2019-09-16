/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { ComponentType } from "react";
import "@marko/testing-library/cleanup-after-each";
import { render } from "@testing-library/react";
import {
  ErrorBoundary,
  Props,
} from "../components/ErrorBoundary/error-boundary.component";
import { closeMessage } from "./test_utils";

const mockOnError = jest.fn();
let consoleErrorSpy: jest.SpyInstance;

beforeAll(() => {
  consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {
    // because react will still render the error in dev and test despite
    // using error boundary
  });
});

afterAll(() => {
  consoleErrorSpy.mockRestore();
});

it("does not throw if no error and children not provided", () => {
  const { ui } = makeComp({
    props: {},
  });

  const {} = render(ui);
});

it("renders children when no error", () => {
  const { ui } = makeComp({
    props: {
      children: <ChildComponent />,
      onError: mockOnError,
    },
  });

  const {} = render(ui);
  expect((document.getElementById("me") as any).textContent).toEqual("yes");
  expect(mockOnError).not.toHaveBeenCalled();
});

it("renders default fallback and calls on error", () => {
  const { ui } = makeComp({
    props: {
      children: (
        <ChildComponent
          fn={() => {
            throw new Error("boom");
          }}
        />
      ),
      onError: mockOnError,
    },
  });

  const {} = render(ui);

  expect(document.getElementById("me") as any).toBeNull();

  const $elm = getFallbackDom();
  expect($elm).not.toBeNull();

  closeMessage($elm);
  expect(getFallbackDom()).toBeNull();
  expect(mockOnError).toHaveBeenCalled();
});

it("renders by calling fallback prop", () => {
  const { ui } = makeComp({
    props: {
      children: (
        <ChildComponent
          fn={() => {
            throw new Error("boom");
          }}
        />
      ),

      fallback: ({ error }) => <div id="aa"> {error.message} </div>,
    },
  });

  const {} = render(ui);
  expect(
    (document.getElementById("aa") as HTMLDivElement).textContent,
  ).toContain("boom");
  expect(getFallbackDom()).toBeNull();
});

////////////////////////// HELPER FUNCTIONS ///////////////////////////

const ErrorBoundaryP = ErrorBoundary as ComponentType<Partial<Props>>;

function makeComp({ props = {} }: { props?: Partial<Props> } = {}) {
  mockOnError.mockReset();
  return {
    ui: <ErrorBoundaryP {...props} />,
  };
}

function ChildComponent({ fn }: { fn?: () => void }) {
  if (fn) {
    fn();
  }

  return <div id="me">yes</div>;
}

function getFallbackDom() {
  return document.getElementById("error-boundary-default-fallback") as any;
}

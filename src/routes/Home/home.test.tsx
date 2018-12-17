import React from "react";
import "jest-dom/extend-expect";
import "react-testing-library/cleanup-after-each";
import { render, fireEvent } from "react-testing-library";

import Home from "./home-x";
import { Props } from "./home";
import { testWithRouter } from "../../test_utils";
import { ROOT_URL, NEW_EXP_URL } from "../../Routing";

it("renders loading state and not main", () => {
  const { Ui } = testWithRouter<Props>(Home);
  // tslint:disable-next-line:no-any
  const props: Props = { loading: true } as any;
  const { getByTestId, getByText, queryByTestId } = render(<Ui {...props} />);

  expect(getByText("Home")).toBeInTheDocument();
  expect(getByTestId("loading-spinner")).toBeInTheDocument();
  expect(queryByTestId("home-route-main")).not.toBeInTheDocument();
});

it("renders empty exps", () => {
  const mockPush = jest.fn();

  const { Ui } = testWithRouter<Props>(Home, {
    push: mockPush,
    path: ROOT_URL
  });

  // tslint:disable-next-line:no-any
  const props: Props = { exps: [] } as any;
  const { getByTestId, getByText, queryByTestId } = render(<Ui {...props} />);

  expect(queryByTestId("loading-spinner")).not.toBeInTheDocument();

  const $btn = getByTestId("go-to-new-exp");
  expect($btn.getAttribute("name")).toBe("go-to-new-exp");
  expect($btn).toHaveTextContent("+");

  const $goToNewExp = getByText(/Click here to create your first experience/);
  fireEvent.click($goToNewExp);
  expect(mockPush).toBeCalledWith(NEW_EXP_URL);
});

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
////////////////////////// HELPER FUNCTIONS ///////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

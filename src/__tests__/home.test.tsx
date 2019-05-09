import React from "react";
import "jest-dom/extend-expect";
import "react-testing-library/cleanup-after-each";
import { render, fireEvent } from "react-testing-library";

import Home from "../components/Home/home-x";
import { Props } from "../components/Home/home";
import { testWithRouter } from "./test_utils";
import { ROOT_URL, NEW_EXP_URL, makeExpRoute } from "../routes";
import { GetExps_exps } from "../graphql/apollo-gql";

it("renders loading state and not main", () => {
  const { Ui } = testWithRouter<Props>(Home);
  // tslint:disable-next-line:no-any
  const props: Props = { loading: true } as any;
  const { getByTestId, getByText, queryByTestId } = render(<Ui {...props} />);

  expect(getByText("Home")).toBeInTheDocument();
  expect(getByTestId("loading-spinner")).toBeInTheDocument();
  expect(queryByTestId("home-route-main")).not.toBeInTheDocument();
  expect(queryByTestId("exps-container")).not.toBeInTheDocument();
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
  expect(queryByTestId("exps-container")).not.toBeInTheDocument();

  const $btn = getByTestId("go-to-new-exp");
  expect($btn.getAttribute("name")).toBe("go-to-new-exp");
  expect($btn).toHaveTextContent("+");

  const $goToNewExp = getByText(/Click here to create your first experience/);
  fireEvent.click($goToNewExp);
  expect(mockPush).toBeCalledWith(NEW_EXP_URL);
});

it("renders exps", () => {
  const mockPush = jest.fn();

  const { Ui } = testWithRouter<Props>(Home, {
    push: mockPush,
    path: ROOT_URL
  });

  const [id1, id2] = [new Date(), new Date()].map((d, index) =>
    (d.getTime() + index).toString()
  );

  const exps: GetExps_exps[] = [
    {
      id: id1,
      description: "lovely experience description 1",
      title: "love experience title 1"
    },

    {
      id: id2,
      title: "love experience title 2",
      description: null
    }
  ];

  // tslint:disable-next-line:no-any
  const props: Props = { exps } as any;
  const { queryByText, getByText, queryByTestId, getByTestId } = render(
    <Ui {...props} />
  );

  expect(getByText("love experience title 2")).toBeInTheDocument();
  expect(queryByTestId(`exp-toggle-${id2}`)).not.toBeInTheDocument();

  const $exp1 = getByText("love experience title 1");
  expect($exp1).toBeInTheDocument();

  let $expToggle = getByTestId(`exp-toggle-${id1}`);
  expect($expToggle).toBeInTheDocument();
  expect($expToggle.classList).toContain("right");
  expect($expToggle.classList).not.toContain("down");

  fireEvent.click($expToggle);
  $expToggle = getByTestId(`exp-toggle-${id1}`);
  expect($expToggle.classList).toContain("down");
  expect($expToggle.classList).not.toContain("right");
  expect(getByText("lovely experience description 1")).toBeInTheDocument();

  fireEvent.click($expToggle);
  expect($expToggle.classList).toContain("right");
  expect($expToggle.classList).not.toContain("down");
  expect(
    queryByText("lovely experience description 1")
  ).not.toBeInTheDocument();

  fireEvent.click($exp1);
  expect(mockPush).toBeCalledWith(makeExpRoute(id1));
});

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
////////////////////////// HELPER FUNCTIONS ///////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

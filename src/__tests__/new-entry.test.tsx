// tslint:disable: no-any
import React, { ComponentType } from "react";
import "jest-dom/extend-expect";
import "react-testing-library/cleanup-after-each";
import { render } from "react-testing-library";

import { NewEntry } from "../components/NewEntry/component";
import { Props } from "../components/NewEntry/utils";
import { renderWithRouter } from "./test_utils";
import { GetAnExp_exp } from "../graphql/apollo-types/GetAnExp";
import { FieldType } from "../graphql/apollo-types/globalTypes";

type P = ComponentType<Partial<Props>>;
const NewEntryP = NewEntry as P;
const title = "what lovely experience";

it("renders loading indicator if we have not returned from server", () => {
  /**
   * Given that we have not received experience from server
   */
  const { ui } = makeComp({ getExperienceGql: { loading: true } as any });

  /**
   * While we are on new entry page
   */
  const { getByTestId } = render(ui);

  /**
   * Then we should see loading indicator
   */
  expect(getByTestId("loading-spinner")).toBeInTheDocument();
});

it("renders loading indicator if we get no experience from server", () => {
  /**
   * Given that we have received null experience from server
   */
  const { ui } = makeComp({ getExperienceGql: { exp: null } as any });

  /**
   * While we are on new entry page
   */
  const { getByTestId } = render(ui);

  /**
   * Then we should see loading indicator
   */
  expect(getByTestId("loading-spinner")).toBeInTheDocument();
});

it("creates new experience entry", () => {
  /**
   * Given we have received experiences from server
   */
  const exp: GetAnExp_exp = {
    id: "1",
    title,
    fieldDefs: [
      { id: "f1", name: "f1", type: FieldType.DATE, __typename: "FieldDef" },
      {
        id: "f2",
        name: "f2",
        type: FieldType.DATETIME,
        __typename: "FieldDef"
      },
      { id: "f3", name: "f3", type: FieldType.DECIMAL, __typename: "FieldDef" },
      { id: "f4", name: "f4", type: FieldType.INTEGER, __typename: "FieldDef" },
      {
        id: "f5",
        name: "f5",
        type: FieldType.SINGLE_LINE_TEXT,
        __typename: "FieldDef"
      },
      {
        id: "f6",
        name: "f6",
        type: FieldType.MULTI_LINE_TEXT,
        __typename: "FieldDef"
      }
    ],
    description: "lovely",
    __typename: "Experience"
  };

  const { ui } = makeComp({
    getExperienceGql: { exp } as any
  });

  /**
   * While we are on new entry page
   */
  const { queryByTestId } = render(ui);

  /**
   * Then we should not see loading indicator
   */
  expect(queryByTestId("loading-spinner")).not.toBeInTheDocument();
});

function makeComp(props: Partial<Props> = { getExperienceGql: {} as any }) {
  const { Ui, ...rest } = renderWithRouter(
    NewEntryP,
    {},
    { ...props, SidebarHeader: jest.fn(() => null) }
  );

  return {
    ui: <Ui />,
    ...rest
  };
}

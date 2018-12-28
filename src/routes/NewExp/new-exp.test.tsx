import React from "react";
import "jest-dom/extend-expect";
import "react-testing-library/cleanup-after-each";
import { render, fireEvent, wait } from "react-testing-library";
import {
  getByText as domGetByText,
  Matcher,
  SelectorMatcherOptions
} from "dom-testing-library";

import NewExp from "./new-exp-x";
import {
  CreateExp as FormValues,
  CreateFieldDef,
  FieldType
} from "../../graphql/apollo-gql.d";
import { Props } from "./new-exp";
import { testWithRouter, fillField } from "../../test_utils";
import { makeExpRoute } from "../../Routing";

it("renders main", async () => {
  const mockReplace = jest.fn();
  const { Ui } = testWithRouter<Props>(NewExp, { replace: mockReplace });
  const mockCreateExpUpdate = jest.fn();

  const result = {
    data: {
      exp: {
        id: "expId1"
      }
    }
  };

  const mockCreateExp = jest.fn(() => Promise.resolve(result));

  const props: Props = {
    createExp: mockCreateExp,
    createExpUpdate: mockCreateExpUpdate
    // tslint:disable-next-line:no-any
  } as any;
  const {
    queryByLabelText,
    getByText,
    getByLabelText,
    getByTestId,
    queryByTestId
  } = render(<Ui {...props} />);

  expect(getByText("New Experience")).toBeInTheDocument();

  const $btn = getByText("Submit");
  expect($btn).toBeDisabled();

  const fieldDefs: CreateFieldDef[] = [
    {
      name: "Nice field 1",
      type: FieldType.SINGLE_LINE_TEXT
    },

    {
      name: "Nice field 2",
      type: FieldType.DATETIME
    },

    {
      name: "Nice field 3",
      type: FieldType.INTEGER
    }
  ];

  const formValue: FormValues = {
    title: "Exp 1",
    description: "Exp desc 1",
    fieldDefs
  };

  fillField(getByLabelText("Title"), formValue.title);
  expect($btn).not.toBeDisabled();

  /**
   * TOGGLING DESCRIPTION
   */
  expect(getByLabelText("Description")).toBeInTheDocument();
  const $descToggle = getByTestId("description-field-toggle");
  fireEvent.click($descToggle);
  expect(queryByLabelText("Description")).not.toBeInTheDocument();
  fireEvent.click($descToggle);
  const $desc = getByLabelText("Description");
  expect($desc).toBeInTheDocument();
  fillField($desc, formValue.description as string);

  // If the first field is empty, then controls are not shown
  expect(queryByTestId("field-controls-1")).not.toBeInTheDocument();

  // So we fill the name and data type fields to see the controls
  fillField(getByLabelText("Field 1 Name"), fieldDefs[0].name);

  fireEvent.click(
    domGetByText(
      getByText("Field 1 Data Type").parentElement as HTMLDivElement,
      FieldType.SINGLE_LINE_TEXT
    )
  );

  expect(getByTestId("field-controls-1")).toBeInTheDocument();
  // but only `add-field-btn` is shown. All other controls are invisible
  expect(queryByTestId("remove-field-btn-1")).not.toBeInTheDocument();
  expect(queryByTestId("go-up-field-btn-1")).not.toBeInTheDocument();
  expect(queryByTestId("go-down-field-btn-1")).not.toBeInTheDocument();

  // the only visible button
  const $field1AddBtn = getByTestId("add-field-btn-1");
  fireEvent.click($field1AddBtn);

  // when a new field is added, the first field's go-down-field-btn and
  // remove-field-btn are shown
  expect(getByTestId("go-down-field-btn-1")).toBeInTheDocument();
  expect(getByTestId("remove-field-btn-1")).toBeInTheDocument();

  // we show that when field 2 is removed, remove-field-btn and
  // go-down-field-btn of field1 are gone are gone
  fireEvent.click(getByTestId("remove-field-btn-2"));
  expect(queryByTestId("remove-field-btn-1")).not.toBeInTheDocument();
  expect(queryByTestId("go-down-field-btn-1")).not.toBeInTheDocument();

  fireEvent.click($field1AddBtn);
  // when field 2 is re-added, the buttons for field 1 are back
  expect(getByTestId("remove-field-btn-1")).toBeInTheDocument();
  expect(getByTestId("go-down-field-btn-1")).toBeInTheDocument();
  expect(queryByTestId("go-up-field-btn-1")).not.toBeInTheDocument();

  /**
   * field 2 now has 2 of the 4 buttons.  add-field-btn will not show up
   * until we fill out field 2.
   * Since this is the last field, go down button will not be rendered
   */

  expect(queryByTestId("add-field-btn-2")).not.toBeInTheDocument();
  expect(queryByTestId("go-down-field-btn-2")).not.toBeInTheDocument();
  expect(getByTestId("remove-field-btn-2")).toBeInTheDocument();
  expect(getByTestId("go-up-field-btn-2")).toBeInTheDocument();

  // filling field 2
  fillField(getByLabelText("Field 2 Name"), fieldDefs[1].name);

  const $field2DataType = selectDataType(
    getByText,
    "Field 2 Data Type",
    FieldType.DATETIME
  );

  // before it is selected, it should not have attribute role
  expect($field2DataType).not.toHaveAttribute("role");
  fireEvent.click($field2DataType);

  // after Selection, it should have attribute role
  expect(
    selectDataType(
      getByText,
      "Field 2 Data Type",
      FieldType.DATETIME
    ).getAttribute("role")
  ).toBe("alert");

  // field 2 add button appears
  expect(getByTestId("add-field-btn-2")).toBeInTheDocument();

  // let's click the add button on field 1 to add a 3rd field but immediately
  // after field 1
  fireEvent.click($field1AddBtn);

  // Let's verify that field 2 has now been shifted to position 3. The new
  // field 2 name is empty
  expect(getByLabelText("Field 2 Name").getAttribute("value")).toBe("");
  // field 2 datetime dropdown has not been selected
  expect(
    selectDataType(getByText, "Field 2 Data Type", FieldType.DATETIME)
  ).not.toHaveAttribute("role");

  // our former field 2 is now field 3
  expect(getByLabelText("Field 3 Name").getAttribute("value")).toBe(
    fieldDefs[1].name
  );

  expect(
    selectDataType(
      getByText,
      "Field 3 Data Type",
      FieldType.DATETIME
    ).getAttribute("role")
  ).toBe("alert");

  /**
   * the new field 2 has up, down and remove buttons, but no add button
   * because field's name and data type are empty.
   */
  expect(queryByTestId("add-field-btn-2")).not.toBeInTheDocument();
  expect(getByTestId("remove-field-btn-2")).toBeInTheDocument();
  expect(getByTestId("go-up-field-btn-2")).toBeInTheDocument();
  const $newField2DownBtn = getByTestId("go-down-field-btn-2");

  // we fill new field 2 and verify add button shows up
  fillField(getByLabelText("Field 2 Name"), fieldDefs[2].name);

  fireEvent.click(
    selectDataType(getByText, "Field 2 Data Type", fieldDefs[2].type)
  );
  /** Now that the field is filled completely, add button shows */
  expect(getByTestId("add-field-btn-2")).toBeInTheDocument();

  // Let us swap fields 2 and 3 by clicking down button on field 2.
  // We verify field 3 has been shifted up
  // (to position 2) while field 2 has been shifted down to position 3
  fireEvent.click($newField2DownBtn);

  // field 3 is now field 2 - we have restored original field 2
  expect(getByLabelText("Field 2 Name").getAttribute("value")).toBe(
    fieldDefs[1].name
  );

  expect(
    selectDataType(
      getByText,
      "Field 2 Data Type",
      FieldType.DATETIME
    ).getAttribute("role")
  ).toBe("alert");

  // and field 2 is now field 3
  expect(getByLabelText("Field 3 Name").getAttribute("value")).toBe(
    fieldDefs[2].name
  );

  expect(
    selectDataType(
      getByText,
      "Field 3 Data Type",
      fieldDefs[2].type
    ).getAttribute("role")
  ).toBe("alert");

  // Let us swap fields 1 and 2 by clicking up button on field 2.
  // We verify field 2 has been shifted up
  // (to position 1) while field 1 has been shifted down to position 2
  fireEvent.click(getByTestId("go-up-field-btn-2"));

  // field 2 is now field 1
  expect(getByLabelText("Field 1 Name").getAttribute("value")).toBe(
    fieldDefs[1].name
  );

  expect(
    selectDataType(
      getByText,
      "Field 1 Data Type",
      FieldType.DATETIME
    ).getAttribute("role")
  ).toBe("alert");

  // field 1 is now field 2
  expect(getByLabelText("Field 2 Name").getAttribute("value")).toBe(
    fieldDefs[0].name
  );

  expect(
    selectDataType(
      getByText,
      "Field 2 Data Type",
      FieldType.SINGLE_LINE_TEXT
    ).getAttribute("role")
  ).toBe("alert");

  /** Let's restore order of the field defs - just to conform to their order
   * in form value (so we don't need to re-arrange form values)
   */
  fireEvent.click(getByTestId("go-up-field-btn-2"));
  expect($btn.classList).not.toContain("loading");
  fireEvent.click($btn);
  expect($btn.classList).toContain("loading");
  expect($btn).toBeDisabled();
  await wait(() =>
    expect(mockCreateExp).toBeCalledWith({
      variables: {
        exp: formValue
      },
      update: mockCreateExpUpdate
    })
  );

  expect(mockReplace).toBeCalledWith(makeExpRoute("expId1"));
});

it("renders errors if two field defs have same name", async () => {
  const fieldDefs: CreateFieldDef[] = [
    {
      name: "Nice field",
      type: FieldType.SINGLE_LINE_TEXT
    },

    {
      name: "Nice field",
      type: FieldType.DATETIME
    }
  ];

  const formValue: FormValues = {
    title: "Exp 2",
    fieldDefs
  };

  const { Ui } = testWithRouter<Props>(NewExp);

  const props: Props = {
    createExp: jest.fn(() =>
      Promise.reject({
        graphQLErrors: [
          {
            message: `{\"field_defs\":[{\"name\":\"${
              fieldDefs[1].name
            }---1 has already been taken\"}]}`
          }
        ]
      })
    )
    // tslint:disable-next-line:no-any
  } as any;

  const { getByText, getByLabelText, getByTestId, queryByText } = render(
    <Ui {...props} />
  );

  fillField(getByLabelText("Title"), formValue.title);
  fillField(getByLabelText("Field 1 Name"), fieldDefs[0].name);

  fireEvent.click(
    selectDataType(getByText, "Field 1 Data Type", FieldType.SINGLE_LINE_TEXT)
  );

  fireEvent.click(getByTestId("add-field-btn-1"));
  fillField(getByLabelText("Field 2 Name"), fieldDefs[1].name);

  fireEvent.click(
    selectDataType(getByText, "Field 2 Data Type", FieldType.DATETIME)
  );

  const $fieldDef2Container = getByTestId("field-def-container-2");
  const $field2 = $fieldDef2Container.querySelector(".field") as HTMLDivElement;
  expect($fieldDef2Container.classList).not.toContain("errors");
  expect($field2.classList).not.toContain("error");
  expect($field2).not.toContain(queryByText("has already been taken"));

  fireEvent.click(getByText("Submit"));
  await wait(() => expect($fieldDef2Container.classList).toContain("errors"));
  expect($field2.classList).toContain("error");
  expect($field2).toContainElement(getByText("has already been taken"));

  throw Error("Test form error one field is empty");
});

function selectDataType(
  getByText: (
    text: Matcher,
    options?: SelectorMatcherOptions | undefined
  ) => HTMLElement,
  labelText: string,
  dataType: string
) {
  return domGetByText(
    getByText(labelText).parentElement as HTMLDivElement,
    dataType
  );
}

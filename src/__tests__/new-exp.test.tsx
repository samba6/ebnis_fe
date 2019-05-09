// tslint:disable:no-any
import React from "react";
import "jest-dom/extend-expect";
import "react-testing-library/cleanup-after-each";
import { render, fireEvent, wait } from "react-testing-library";
import {
  getByText as domGetByText,
  Matcher,
  SelectorMatcherOptions
} from "dom-testing-library";

import { NewExperience } from "../components/NewExp/new-exp-x";
import {
  CreateExp as FormValues,
  CreateFieldDef,
  FieldType
} from "../graphql/apollo-gql.d";
import { Props } from "../components/NewExp/new-exp";
import { testWithRouter, fillField } from "./test_utils";
import { makeExpRoute } from "../routes";

it("renders main", async () => {
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

  const mockReplace = jest.fn();
  const { Ui } = testWithRouter<Props>(NewExperience, { replace: mockReplace });
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
  } as any;

  /**
   * Given we are using new experience component
   */
  const {
    queryByLabelText,
    getByText,
    getByLabelText,
    getByTestId,
    queryByTestId
  } = render(<Ui {...props} />);

  /**
   * Then the title should be visible
   */
  expect(getByText("New Experience")).toBeInTheDocument();

  /**
   * And description field should be visible
   */
  expect(getByLabelText("Description")).toBeInTheDocument();

  /**
   * And controls to add/delete fields should not be visible
   */
  expect(queryByTestId("field-controls-1")).not.toBeInTheDocument();

  /**
   * And the submit button should be disabled
   */
  const $btn = getByText("Submit");
  expect($btn).toBeDisabled();

  /**
   * When we fill the title field
   */
  fillField(getByLabelText("Title"), formValue.title);

  /**
   * Then the submit button should be enabled
   */
  expect($btn).not.toBeDisabled();

  /**
   * When we click on description field toggler
   */
  const $descToggle = getByTestId("description-field-toggle");
  fireEvent.click($descToggle);

  /**
   * Then description field should not be visible
   */
  expect(queryByLabelText("Description")).not.toBeInTheDocument();

  /**
   * When we click again on the description field toggler
   */
  fireEvent.click($descToggle);
  const $desc = getByLabelText("Description");

  /**
   * Then description field should be visible again
   */
  expect($desc).toBeInTheDocument();

  /**
   * fill description field
   */
  fillField($desc, formValue.description as string);

  /**
   * When we fill name text box of field 1
   */
  fillField(getByLabelText("Field 1 Name"), fieldDefs[0].name);

  /**
   * And select one of the data types in the select box
   */
  fireEvent.click(
    domGetByText(
      getByText("Field 1 Data Type").parentElement as HTMLDivElement,
      FieldType.SINGLE_LINE_TEXT
    )
  );

  /**
   * Then controls to add field should now be in the document
   */
  expect(getByTestId("field-controls-1")).toBeInTheDocument();

  /**
   * But other controls (to delete and move fields) should not be
   * visible (because we have only one field)
   */
  expect(queryByTestId("remove-field-btn-1")).not.toBeInTheDocument();
  expect(queryByTestId("go-up-field-btn-1")).not.toBeInTheDocument();
  expect(queryByTestId("go-down-field-btn-1")).not.toBeInTheDocument();

  /**
   * When we click on add button of field 1
   */
  const $field1AddBtn = getByTestId("add-field-btn-1");
  fireEvent.click($field1AddBtn);

  /**
   * Then field 1 should have control to move the field down and delete the
   * field
   */
  expect(getByTestId("go-down-field-btn-1")).toBeInTheDocument();
  expect(getByTestId("remove-field-btn-1")).toBeInTheDocument();

  /**
   * When we click on delete button of field 2
   */
  fireEvent.click(getByTestId("remove-field-btn-2"));

  /**
   * Then add and delete buttons of field 1 should not be visible anymore
   */
  expect(queryByTestId("remove-field-btn-1")).not.toBeInTheDocument();
  expect(queryByTestId("go-down-field-btn-1")).not.toBeInTheDocument();

  /**
   * When we click again on field 1 add button
   */
  fireEvent.click($field1AddBtn);

  /**
   * Then we should see see the remove and move down buttons of field 1 again
   */
  expect(getByTestId("remove-field-btn-1")).toBeInTheDocument();
  expect(getByTestId("go-down-field-btn-1")).toBeInTheDocument();

  /**
   * But field 1 should not have a go up button
   */
  expect(queryByTestId("go-up-field-btn-1")).not.toBeInTheDocument();

  /**
   * And field 2 should not have add button (because it is empty)
   */
  expect(queryByTestId("add-field-btn-2")).not.toBeInTheDocument();

  /**
   * And field 2 should not have move down button (because it is the last field)
   */
  expect(queryByTestId("go-down-field-btn-2")).not.toBeInTheDocument();

  /**
   * And field 2 should have remove and move up buttons
   */
  expect(getByTestId("remove-field-btn-2")).toBeInTheDocument();
  expect(getByTestId("go-up-field-btn-2")).toBeInTheDocument();

  /**
   * When we fill name text box of field 2
   */
  fillField(getByLabelText("Field 2 Name"), fieldDefs[1].name);

  /**
   * And date time option of data type dropdown of field 2 should not an HTML
   * attribute 'role
   */
  const $field2DataType = selectDataType(
    getByText,
    "Field 2 Data Type",
    FieldType.DATETIME
  );

  expect($field2DataType).not.toHaveAttribute("role");

  /**
   * When we select date time option of data type dropdown of field 2
   */
  fireEvent.click($field2DataType);

  /**
   * Then the date time option should have an HTML attribute role
   */
  expect(
    selectDataType(
      getByText,
      "Field 2 Data Type",
      FieldType.DATETIME
    ).getAttribute("role")
  ).toBe("alert");

  /**
   * And add button of field 2 should now be visible (because the field has
   * now been filled)
   */
  expect(getByTestId("add-field-btn-2")).toBeInTheDocument();

  /**
   * When we click on add button of field 1
   */
  fireEvent.click($field1AddBtn);

  /**
   * Then an empty field should be added beneath field 1
   */
  expect(getByLabelText("Field 2 Name").getAttribute("value")).toBe("");
  // field 2 datetime dropdown has not been selected
  // (but the previous field 2's datetime dropdown was selected)
  expect(
    selectDataType(getByText, "Field 2 Data Type", FieldType.DATETIME)
  ).not.toHaveAttribute("role");

  /**
   * And the former field 2 should now be moved one level down
   * (to position 2)
   */
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
   * And field 2 add button should not be visible (because field is empty)
   */
  expect(queryByTestId("add-field-btn-2")).not.toBeInTheDocument();

  /**
   * But field 2 remove and move up buttons should be in the document
   */
  expect(getByTestId("remove-field-btn-2")).toBeInTheDocument();
  expect(getByTestId("go-up-field-btn-2")).toBeInTheDocument();

  /**
   * When we fill field 2
   */
  const $newField2DownBtn = getByTestId("go-down-field-btn-2");
  fillField(getByLabelText("Field 2 Name"), fieldDefs[2].name);

  fireEvent.click(
    selectDataType(getByText, "Field 2 Data Type", fieldDefs[2].type)
  );

  /**
   * Then add button of field 2 should now be in the document
   */
  expect(getByTestId("add-field-btn-2")).toBeInTheDocument();

  /**
   * When we click on move down button of field 2
   */
  fireEvent.click($newField2DownBtn);

  /**
   * Then field 3 should now move up to occupy position 2
   */
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

  /**
   * And former field 2 should move down to occupy position 3
   */
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

  /**
   * When we click on move up button of field 2
   */
  fireEvent.click(getByTestId("go-up-field-btn-2"));

  /**
   * Then field 2 should move up to occupy field 1
   */
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

  /**
   * And former field 1 should move down to occupy position 2
   */
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

  /**
   * And submit button should not show loading indicator
   */
  expect($btn.classList).not.toContain("loading");

  /** Let's restore order of the field defs - just to conform to their order
   * in form value (so we don't need to re-arrange form values)
   */
  fireEvent.click(getByTestId("go-up-field-btn-2"));

  /**
   * When we submit the form
   */
  fireEvent.click($btn);

  /**
   * Then submit button should show loading indicator
   */
  expect($btn.classList).toContain("loading");

  /**
   * And submit button should be disabled
   */
  expect($btn).toBeDisabled();

  /**
   * And correct data should be sent to the server
   */
  await wait(
    () =>
      expect(mockCreateExp).toBeCalledWith({
        variables: {
          exp: formValue
        },
        update: mockCreateExpUpdate
      }),
    { interval: 1 }
  );

  /**
   * And we should be redirected away from the page
   */
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

  const { Ui } = testWithRouter<Props>(NewExperience);

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
  } as any;

  /**
   * Given we are using new exp component
   */
  const { getByText, getByLabelText, getByTestId, queryByText } = render(
    <Ui {...props} />
  );

  /**
   * When we complete two fields, giving them same name
   */
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

  /**
   * Then no error Uis should be visible
   */
  const $fieldDef2Container = getByTestId("field-def-container-2");
  expect($fieldDef2Container.classList).not.toContain("errors");

  const $field2 = $fieldDef2Container.querySelector(".field") as HTMLDivElement;

  expect($field2.classList).not.toContain("error");
  expect($field2).not.toContain(queryByText("has already been taken"));

  /**
   * When we submit the form
   */

  fireEvent.click(getByText("Submit"));

  /**
   * Then error UIs should be visible
   */
  await wait(() => expect($fieldDef2Container.classList).toContain("errors"));

  expect($field2.classList).toContain("error");
  expect($field2).toContainElement(getByText("has already been taken"));
});

it("renders error if all fields not completely filled on submission", async () => {
  const fieldDefs: CreateFieldDef[] = [
    {
      name: "Nice field",
      type: FieldType.SINGLE_LINE_TEXT
    },

    {
      name: "",
      type: FieldType.DATETIME
    }
  ];

  const formValue: FormValues = {
    title: "Exp 2",
    fieldDefs
  };

  const { Ui } = testWithRouter<Props>(NewExperience);

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
  } as any;

  /**
   * Given we are using new exp component
   */
  const { getByText, getByLabelText, getByTestId, queryByText } = render(
    <Ui {...props} />
  );

  /**
   * When we complete two fields, but leaving name text box of field 2 empty
   */
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

  /**
   * Then no error Uis should be visible
   */
  const $fieldDef2Container = getByTestId("field-def-container-2");
  expect($fieldDef2Container.classList).not.toContain("errors");

  const $field2 = $fieldDef2Container.querySelector(".field") as HTMLDivElement;

  expect($field2.classList).not.toContain("error");
  expect($field2).not.toContain(queryByText("must be at least 2 characters"));

  /**
   * When we submit the form
   */

  fireEvent.click(getByText("Submit"));

  /**
   * Then error UIs should be visible
   */
  await wait(() => expect($fieldDef2Container.classList).toContain("errors"));

  expect($field2.classList).toContain("error");
  expect($field2).toContainElement(getByText("must be at least 2 characters"));
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

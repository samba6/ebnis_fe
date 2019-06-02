// tslint:disable:no-any
import React, { ComponentType } from "react";
import "jest-dom/extend-expect";
import "react-testing-library/cleanup-after-each";
import { render, fireEvent, wait } from "react-testing-library";
import {
  getByText as domGetByText,
  Matcher,
  SelectorMatcherOptions
} from "dom-testing-library";

import { ExperienceDefinition } from "../components/ExperienceDefinition/component";
import { CreateFieldDef, FieldType } from "../graphql/apollo-types/globalTypes";
import { Props } from "../components/ExperienceDefinition/utils";
import { fillField, renderWithRouter } from "./test_utils";
import { makeExperienceRoute } from "../constants/experience-route";

jest.mock("../components/ExperienceDefinition/update");
jest.mock("../components/ExperienceDefinition/scrollTop");
jest.mock("../components/SidebarHeader", () => ({
  SidebarHeader: jest.fn(() => null)
}));

import { ExperienceDefinitionUpdate } from "../components/ExperienceDefinition/update";
import { scrollTop } from "../components/ExperienceDefinition/scrollTop";

const mockScrollTop = scrollTop as jest.Mock;

const ExperienceDefinitionP = ExperienceDefinition as ComponentType<
  Partial<Props>
>;

const title = "my experience";

it("adds field from top", async () => {
  const fieldDefs: CreateFieldDef[] = [
    {
      name: "Nice field 1",
      type: FieldType.SINGLE_LINE_TEXT
    },

    {
      name: "Nice field 2",
      type: FieldType.DATETIME
    }
  ];

  const { Ui, mockNavigate, mockCreateExp } = makeComp();

  mockCreateExp.mockResolvedValue({
    data: {
      exp: {
        id: "expId1"
      }
    }
  });

  /**
   * Given we are using new experience component
   */
  const { getByText, getByLabelText, getByTestId, queryByTestId } = render(
    <Ui />
  );

  /**
   * And we complete the title field
   */
  fillField(getByLabelText("Title"), title);

  /**
   * Then add button of field 1 should not be visible
   */
  expect(queryByTestId("add-field-btn-1")).not.toBeInTheDocument();

  /**
   * When we complete field name field of field 1
   */
  fillField(getByLabelText("Field 1 Name"), fieldDefs[0].name);

  /**
   * Then add button of field 1 should not be visible
   */
  expect(queryByTestId("add-field-btn-1")).not.toBeInTheDocument();

  /**
   * When we complete data type field of field 1
   */
  fireEvent.click(
    selectDataType(getByText, "Field 1 Data Type", fieldDefs[0].type)
  );

  /**
   * Then add button of field 1 should be visible
   */
  const $add1 = getByTestId("add-field-btn-1");
  expect($add1).toBeInTheDocument();

  /**
   * And remove button of field 1 should not be visible
   */
  expect(queryByTestId("remove-field-btn-1")).not.toBeInTheDocument();

  /**
   * And move down button of field 1 should not be visible
   */
  expect(queryByTestId("go-down-field-btn-1")).not.toBeInTheDocument();

  /**
   * And move up button of field 1 should not be visible
   */
  expect(queryByTestId("go-up-field-btn-1")).not.toBeInTheDocument();

  /**
   * And field 2 should not be visible
   */
  expect(queryByTestId("field-def-container-2")).not.toBeInTheDocument();

  /**
   * When we click on add button of field 1
   */
  fireEvent.click($add1);

  /**
   * Then remove button of field 1 should be visible
   */
  expect(getByTestId("remove-field-btn-1")).toBeInTheDocument();

  /**
   * And move down button of field 1 should be visible
   */
  expect(getByTestId("go-down-field-btn-1")).toBeInTheDocument();

  /**
   * And move up button of field 1 should not be visible
   */
  expect(queryByTestId("go-up-field-btn-1")).not.toBeInTheDocument();

  /**
   * And add button of field 2 should not be visible
   */
  expect(queryByTestId("add-field-btn-2")).not.toBeInTheDocument();

  /**
   * And remove button of field 2 should be visible
   */
  expect(getByTestId("remove-field-btn-2")).toBeInTheDocument();

  /**
   * And move down button of field 2 should not be visible
   */
  expect(queryByTestId("go-down-field-btn-2")).not.toBeInTheDocument();

  /**
   * And move up button of field 2 should be visible
   */
  expect(getByTestId("go-up-field-btn-2")).toBeInTheDocument();

  /**
   * When we complete name field of field 2
   */
  fillField(getByLabelText("Field 2 Name"), fieldDefs[1].name);

  /**
   * Then add button of field 2 should not be visible
   */
  expect(queryByTestId("add-field-btn-2")).not.toBeInTheDocument();

  /**
   * When we complete data type field of field 2
   */
  fireEvent.click(
    selectDataType(getByText, "Field 2 Data Type", fieldDefs[1].type)
  );

  /**
   * Then add button of field 2 should now be visible
   */
  expect(getByTestId("add-field-btn-2")).toBeInTheDocument();

  /**
   * When we submit the form
   */
  fireEvent.click(getByText("Submit"));

  /**
   * Then correct data should be uploaded to the server
   */
  await wait(
    () =>
      expect(mockCreateExp).toBeCalledWith({
        variables: {
          exp: {
            title,
            fieldDefs,
            description: ""
          }
        },
        update: ExperienceDefinitionUpdate
      }),
    { interval: 1 }
  );

  /**
   * And we should be redirected away from the page
   */
  expect(mockNavigate).toBeCalledWith(makeExperienceRoute("expId1"));
});

it("adds field in middle", async () => {
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

  const { Ui, mockNavigate, mockCreateExp } = makeComp();

  mockCreateExp.mockResolvedValue({
    data: {
      exp: {
        id: "expId1"
      }
    }
  });

  /**
   * Given we are using new experience component
   */
  const { getByText, getByLabelText, getByTestId, queryByLabelText } = render(
    <Ui />
  );

  /**
   * And we create and complete 3 field definitions
   */
  fillFields(getByLabelText, getByText, getByTestId, fieldDefs);

  /**
   * Then there should not be a field definition at position 4
   */
  expect(queryByLabelText("Field 4 Name")).not.toBeInTheDocument();

  /**
   * When we click on add button of field 2
   */
  fireEvent.click(getByTestId("add-field-btn-2"));

  /**
   * Then there should be an empty field at position 3
   */
  expect((getByLabelText("Field 3 Name") as any).value).toBe("");

  /**
   * And the field that was formerly at position 3 should now be at position 4
   */
  expect((getByLabelText("Field 4 Name") as any).value).toBe(fieldDefs[2].name);

  /**
   * When we complete the new field and submit the form
   */
  const newField = { name: "Nice field 4", type: FieldType.DECIMAL };
  fillFieldDefinition(getByLabelText, getByText, newField, 3);

  fireEvent.click(getByText("Submit"));

  /**
   * Then correct data should be uploaded to the server
   */
  /**
   * And correct data should be sent to the server
   */
  await wait(
    () =>
      expect(mockCreateExp).toBeCalledWith({
        variables: {
          exp: {
            title,
            fieldDefs: [fieldDefs[0], fieldDefs[1], newField, fieldDefs[2]],
            description: ""
          }
        },
        update: ExperienceDefinitionUpdate
      }),
    { interval: 1 }
  );

  /**
   * And we should be redirected away from the page
   */
  expect(mockNavigate).toBeCalledWith(makeExperienceRoute("expId1"));
});

it("adds field at bottom", async () => {
  const fieldDefs: CreateFieldDef[] = [
    {
      name: "Nice field 1",
      type: FieldType.SINGLE_LINE_TEXT
    },

    {
      name: "Nice field 2",
      type: FieldType.DATETIME
    }
  ];

  const { Ui, mockNavigate, mockCreateExp } = makeComp();

  mockCreateExp.mockResolvedValue({
    data: {
      exp: {
        id: "expId1"
      }
    }
  });

  /**
   * Given we are using new experience component
   */
  const { getByText, getByLabelText, getByTestId, queryByLabelText } = render(
    <Ui />
  );

  /**
   * And we create and complete 2 field definitions
   */
  fillFields(getByLabelText, getByText, getByTestId, fieldDefs);

  /**
   * Then there should not be a field definition at position 3
   */
  expect(queryByLabelText("Field 3 Name")).not.toBeInTheDocument();

  /**
   * When we click on add button of field 2
   */
  fireEvent.click(getByTestId("add-field-btn-2"));

  /**
   * Then there should be an empty field at position 3
   */
  expect((getByLabelText("Field 3 Name") as any).value).toBe("");

  /**
   * When we complete the new field and submit the form
   */
  const newField = { name: "Nice field 3", type: FieldType.DECIMAL };
  fillFieldDefinition(getByLabelText, getByText, newField, 3);

  fireEvent.click(getByText("Submit"));

  /**
   * Then correct data should be uploaded to the server
   */
  /**
   * And correct data should be sent to the server
   */
  await wait(
    () =>
      expect(mockCreateExp).toBeCalledWith({
        variables: {
          exp: {
            title,
            fieldDefs: [fieldDefs[0], fieldDefs[1], newField],
            description: ""
          }
        },
        update: ExperienceDefinitionUpdate
      }),
    { interval: 1 }
  );

  /**
   * And we should be redirected away from the page
   */
  expect(mockNavigate).toBeCalledWith(makeExperienceRoute("expId1"));
});

it("removes field from top", async () => {
  const fieldDefs: CreateFieldDef[] = [
    {
      name: "Nice field 1",
      type: FieldType.SINGLE_LINE_TEXT
    },

    {
      name: "Nice field 2",
      type: FieldType.DATETIME
    }
  ];

  const { Ui, mockNavigate, mockCreateExp } = makeComp();

  mockCreateExp.mockResolvedValue({
    data: {
      exp: {
        id: "expId1"
      }
    }
  });

  /**
   * Given we are using new experience component
   */
  const { getByText, getByLabelText, getByTestId, queryByTestId } = render(
    <Ui />
  );

  /**
   * And we complete the two fields on screen
   */
  fillFields(getByLabelText, getByText, getByTestId, fieldDefs);

  /**
   * Then name field of field 1 should be "Nice field 1"
   */
  expect((getByLabelText("Field 1 Name") as any).value).toBe("Nice field 1");

  /**
   * And field 2 should have add, remove and up buttons
   */
  expect(getByTestId("add-field-btn-2")).toBeInTheDocument();
  expect(getByTestId("remove-field-btn-2")).toBeInTheDocument();
  expect(getByTestId("go-up-field-btn-2")).toBeInTheDocument();

  /**
   * When we click on remove button of field 1
   */
  fireEvent.click(getByTestId("remove-field-btn-1"));

  /**
   * Then former field 1 should no longer be visible on the page
   */

  /**
   * And former field 2 should now be in position 1
   */
  expect((getByLabelText("Field 1 Name") as any).value).toBe("Nice field 2");

  /**
   * And its remove and move up buttons should no longer be visible
   */
  expect(queryByTestId("remove-field-btn-1")).not.toBeInTheDocument();
  expect(queryByTestId("go-up-field-btn-1")).not.toBeInTheDocument();

  /**
   * But its add button should be visible
   */
  expect(getByTestId("add-field-btn-1")).toBeInTheDocument();

  /**
   * When we submit the form
   */
  fireEvent.click(getByText("Submit"));

  /**
   * Then correct data should be uploaded to the server
   */
  await wait(
    () =>
      expect(mockCreateExp).toBeCalledWith({
        variables: {
          exp: {
            title,
            fieldDefs: [fieldDefs[1]],
            description: ""
          }
        },
        update: ExperienceDefinitionUpdate
      }),
    { interval: 1 }
  );

  /**
   * And we should be redirected away from the page
   */
  expect(mockNavigate).toBeCalledWith(makeExperienceRoute("expId1"));
});

it("removes field from bottom", async () => {
  const fieldDefs: CreateFieldDef[] = [
    {
      name: "Nice field 1",
      type: FieldType.SINGLE_LINE_TEXT
    },

    {
      name: "Nice field 2",
      type: FieldType.DATETIME
    }
  ];

  const { Ui, mockNavigate, mockCreateExp } = makeComp();

  mockCreateExp.mockResolvedValue({
    data: {
      exp: {
        id: "expId1"
      }
    }
  });

  /**
   * Given we are using new experience component
   */
  const {
    getByText,
    getByLabelText,
    getByTestId,
    queryByTestId,
    queryByLabelText
  } = render(<Ui />);

  /**
   * And we complete the two fields on screen
   */
  fillFields(getByLabelText, getByText, getByTestId, fieldDefs);

  /**
   * Then field 2 should be visible on the screen
   */
  expect(getByLabelText("Field 2 Name")).toBeInTheDocument();

  /**
   * And field 1 should have add, remove and down buttons
   */
  expect(getByTestId("add-field-btn-1")).toBeInTheDocument();
  expect(getByTestId("remove-field-btn-1")).toBeInTheDocument();
  expect(getByTestId("go-down-field-btn-1")).toBeInTheDocument();

  /**
   * When we click on remove button of field 2
   */
  fireEvent.click(getByTestId("remove-field-btn-2"));

  /**
   * Then field 2 should no longer be visible on the screen
   */
  expect(queryByLabelText("Field 2 Name")).not.toBeInTheDocument();

  /**
   * And field 1's remove and move down buttons should no longer be visible
   */
  expect(queryByTestId("remove-field-btn-1")).not.toBeInTheDocument();
  expect(queryByTestId("go-down-field-btn-1")).not.toBeInTheDocument();

  /**
   * But its add button should be visible
   */
  expect(getByTestId("add-field-btn-1")).toBeInTheDocument();

  /**
   * When we submit the form
   */
  fireEvent.click(getByText("Submit"));

  /**
   * Then correct data should be uploaded to the server
   */
  await wait(
    () =>
      expect(mockCreateExp).toBeCalledWith({
        variables: {
          exp: {
            title,
            fieldDefs: [fieldDefs[0]],
            description: ""
          }
        },
        update: ExperienceDefinitionUpdate
      }),
    { interval: 1 }
  );

  /**
   * And we should be redirected away from the page
   */
  expect(mockNavigate).toBeCalledWith(makeExperienceRoute("expId1"));
});

it("removes field from middle", async () => {
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
      type: FieldType.DECIMAL
    }
  ];

  const { Ui, mockNavigate, mockCreateExp } = makeComp();

  mockCreateExp.mockResolvedValue({
    data: {
      exp: {
        id: "expId1"
      }
    }
  });

  /**
   * Given we are using new experience component
   */
  const { getByText, getByLabelText, getByTestId } = render(<Ui />);

  /**
   * And we complete the 3 fields on screen
   */
  fillFields(getByLabelText, getByText, getByTestId, fieldDefs);

  /**
   * Then field 2 name should contain text for position 2
   */
  expect((getByLabelText("Field 2 Name") as any).value).toBe(fieldDefs[1].name);

  /**
   * When we click on remove button of field 2
   */
  fireEvent.click(getByTestId("remove-field-btn-2"));

  /**
   * Then field 2 name should now contain text formerly at position 3 because
   * former field 2 is no longer on the page and former field 3 has moved up to
   * position 2
   */
  expect((getByLabelText("Field 2 Name") as any).value).toBe(fieldDefs[2].name);

  /**
   * When we submit the form
   */
  fireEvent.click(getByText("Submit"));

  /**
   * Then correct data should be uploaded to the server
   */
  await wait(
    () =>
      expect(mockCreateExp).toBeCalledWith({
        variables: {
          exp: {
            title,
            fieldDefs: [fieldDefs[0], fieldDefs[2]],
            description: ""
          }
        },
        update: ExperienceDefinitionUpdate
      }),
    { interval: 1 }
  );

  /**
   * And we should be redirected away from the page
   */
  expect(mockNavigate).toBeCalledWith(makeExperienceRoute("expId1"));
});

it("moves field up from bottom", async () => {
  const fieldDefs: CreateFieldDef[] = [
    {
      name: "Nice field 1",
      type: FieldType.SINGLE_LINE_TEXT
    },

    {
      name: "Nice field 2",
      type: FieldType.DATETIME
    }
  ];

  const { Ui, mockCreateExp } = makeComp();

  mockCreateExp.mockResolvedValue({
    data: {
      exp: {
        id: "expId1"
      }
    }
  });

  /**
   * Given we are using new experience component
   */
  const { getByText, getByLabelText, getByTestId } = render(<Ui />);

  /**
   * And we complete the two fields on screen
   */
  fillFields(getByLabelText, getByText, getByTestId, fieldDefs);

  /**
   * Then field 1 name should have text at position 1
   */
  expect((getByLabelText("Field 1 Name") as any).value).toBe(fieldDefs[0].name);

  /**
   * And field 2 name should have text at position 2
   */
  expect((getByLabelText("Field 2 Name") as any).value).toBe(fieldDefs[1].name);

  /**
   * When we click on move up button of field 2
   */
  fireEvent.click(getByTestId("go-up-field-btn-2"));

  /**
   * Then field 1 name should have text at position 2 because it has moved up
   */
  expect((getByLabelText("Field 1 Name") as any).value).toBe(fieldDefs[1].name);

  /**
   * And field 2 name should have text at position 1 because it has moved down
   */
  expect((getByLabelText("Field 2 Name") as any).value).toBe(fieldDefs[0].name);

  /**
   * When we submit the form
   */
  fireEvent.click(getByText("Submit"));

  /**
   * Then correct data should be uploaded to the server
   */
  await wait(
    () =>
      expect(mockCreateExp).toBeCalledWith({
        variables: {
          exp: {
            title,
            fieldDefs: [fieldDefs[1], fieldDefs[0]],
            description: ""
          }
        },
        update: ExperienceDefinitionUpdate
      }),
    { interval: 1 }
  );
});

it("moves field up from middle", async () => {
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
      type: FieldType.DATETIME
    }
  ];

  const { Ui, mockCreateExp } = makeComp();

  mockCreateExp.mockResolvedValue({
    data: {
      exp: {
        id: "expId1"
      }
    }
  });

  /**
   * Given we are using new experience component
   */
  const { getByText, getByLabelText, getByTestId } = render(<Ui />);

  /**
   * And we complete the two fields on screen
   */
  fillFields(getByLabelText, getByText, getByTestId, fieldDefs);

  /**
   * Then field 1 name should have text at position 1
   */
  expect((getByLabelText("Field 1 Name") as any).value).toBe(fieldDefs[0].name);

  /**
   * And field 2 name should have text at position 2
   */
  expect((getByLabelText("Field 2 Name") as any).value).toBe(fieldDefs[1].name);

  /**
   * When we click on move up button of field 2
   */
  fireEvent.click(getByTestId("go-up-field-btn-2"));

  /**
   * Then field 1 name should have text at position 2 because it has moved up
   */
  expect((getByLabelText("Field 1 Name") as any).value).toBe(fieldDefs[1].name);

  /**
   * And field 2 name should have text at position 1 because it has moved down
   */
  expect((getByLabelText("Field 2 Name") as any).value).toBe(fieldDefs[0].name);

  /**
   * When we submit the form
   */
  fireEvent.click(getByText("Submit"));

  /**
   * Then correct data should be uploaded to the server
   */
  await wait(
    () =>
      expect(mockCreateExp).toBeCalledWith({
        variables: {
          exp: {
            title,
            fieldDefs: [fieldDefs[1], fieldDefs[0], fieldDefs[2]],
            description: ""
          }
        },
        update: ExperienceDefinitionUpdate
      }),
    { interval: 1 }
  );
});

it("moves field down from top", async () => {
  const fieldDefs: CreateFieldDef[] = [
    {
      name: "Nice field 1",
      type: FieldType.SINGLE_LINE_TEXT
    },

    {
      name: "Nice field 2",
      type: FieldType.DATETIME
    }
  ];

  const { Ui, mockCreateExp } = makeComp();

  mockCreateExp.mockResolvedValue({
    data: {
      exp: {
        id: "expId1"
      }
    }
  });

  /**
   * Given we are using new experience component
   */
  const { getByText, getByLabelText, getByTestId } = render(<Ui />);

  /**
   * And we complete the two fields on screen
   */
  fillFields(getByLabelText, getByText, getByTestId, fieldDefs);

  /**
   * Then field 1 name should have text at position 1
   */
  expect((getByLabelText("Field 1 Name") as any).value).toBe(fieldDefs[0].name);

  /**
   * And field 2 name should have text at position 2
   */
  expect((getByLabelText("Field 2 Name") as any).value).toBe(fieldDefs[1].name);

  /**
   * When we click on move down button of field 1
   */
  fireEvent.click(getByTestId("go-down-field-btn-1"));

  /**
   * Then field 1 name should have text at position 2 because it has moved up
   */
  expect((getByLabelText("Field 1 Name") as any).value).toBe(fieldDefs[1].name);

  /**
   * And field 2 name should have text at position 1 because it has moved down
   */
  expect((getByLabelText("Field 2 Name") as any).value).toBe(fieldDefs[0].name);

  /**
   * When we submit the form
   */
  fireEvent.click(getByText("Submit"));

  /**
   * Then correct data should be uploaded to the server
   */
  await wait(
    () =>
      expect(mockCreateExp).toBeCalledWith({
        variables: {
          exp: {
            title,
            fieldDefs: [fieldDefs[1], fieldDefs[0]],
            description: ""
          }
        },
        update: ExperienceDefinitionUpdate
      }),
    { interval: 1 }
  );
});

it("moves field down from middle", async () => {
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
      type: FieldType.DATETIME
    }
  ];

  const { Ui, mockCreateExp } = makeComp();

  mockCreateExp.mockResolvedValue({
    data: {
      exp: {
        id: "expId1"
      }
    }
  });

  /**
   * Given we are using new experience component
   */
  const { getByText, getByLabelText, getByTestId } = render(<Ui />);

  /**
   * And we complete the 3 fields on screen
   */
  fillFields(getByLabelText, getByText, getByTestId, fieldDefs);

  /**
   * Then field 2 name should have text at position 2
   */
  expect((getByLabelText("Field 2 Name") as any).value).toBe(fieldDefs[1].name);

  /**
   * And field 3 name should have text at position 3
   */
  expect((getByLabelText("Field 3 Name") as any).value).toBe(fieldDefs[2].name);

  /**
   * When we click on move down button of field 2
   */
  fireEvent.click(getByTestId("go-down-field-btn-2"));

  /**
   * Then field 2 name should have text at position 3 because it has moved up
   */
  expect((getByLabelText("Field 2 Name") as any).value).toBe(fieldDefs[2].name);

  /**
   * Then field 3 name should have text at position 2 because it has moved down
   */
  expect((getByLabelText("Field 3 Name") as any).value).toBe(fieldDefs[1].name);

  /**
   * When we submit the form
   */
  fireEvent.click(getByText("Submit"));

  /**
   * Then correct data should be uploaded to the server
   */
  await wait(
    () =>
      expect(mockCreateExp).toBeCalledWith({
        variables: {
          exp: {
            title,
            fieldDefs: [fieldDefs[0], fieldDefs[2], fieldDefs[1]],
            description: ""
          }
        },
        update: ExperienceDefinitionUpdate
      }),
    { interval: 1 }
  );
});

it("toggles description field", () => {
  const { Ui } = makeComp();

  /**
   * Given we are using new experience component
   */
  const {
    queryByLabelText,
    getByLabelText,
    getByTestId,
    queryByTestId
  } = render(<Ui />);

  /**
   * Then description input box should be visible on the page
   */
  expect(getByLabelText("Description")).toBeInTheDocument();

  /**
   * And an icon indicating that description is showing should be visible on
   * the page
   */
  expect(getByTestId("description-visible-icon")).toBeInTheDocument();

  /**
   * And an icon indicating that description is not showing should not be
   * visible on the page
   */
  expect(queryByTestId("description-not-visible-icon")).not.toBeInTheDocument();

  /**
   * When we click on the description label
   */
  fireEvent.click(getByTestId("description-field-toggle"));

  /**
   * Then description input box should no longer be visible on the page
   */
  expect(queryByLabelText("Description")).not.toBeInTheDocument();

  /**
   * And an icon indicating that description is not showing should be visible on
   * the page
   */
  expect(getByTestId("description-not-visible-icon")).toBeInTheDocument();

  /**
   * And an icon indicating that description is showing should not be
   * visible on the page
   */
  expect(queryByTestId("description-visible-icon")).not.toBeInTheDocument();
});

it("renders errors if server returns field defs errors", async () => {
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

  const { Ui, mockCreateExp } = makeComp();

  mockCreateExp.mockRejectedValue({
    graphQLErrors: [
      {
        // it's a JSON string
        message: `{
          "field_defs":[
            {"name":"${fieldDefs[1].name}---1 has already been taken"}
          ],
          "title":"has already been taken"
        }`
      }
    ]
  });

  /**
   * Given we are using new exp component
   */
  const { getByText, getByLabelText, getByTestId, queryByTestId } = render(
    <Ui />
  );

  /**
   * When we complete two fields, giving them same name
   */
  fillFields(getByLabelText, getByText, getByTestId, fieldDefs);

  /**
   * Then no error Uis should be visible
   */
  const $fieldDef2Container = getByTestId("field-def-container-2");
  expect($fieldDef2Container.classList).not.toContain("errors");

  const $field2 = $fieldDef2Container.querySelector(".field") as HTMLDivElement;

  expect($field2.classList).not.toContain("error");
  expect(queryByTestId("form-control-error-2")).not.toBeInTheDocument();

  /**
   * When we submit the form
   */

  fireEvent.click(getByText("Submit"));

  /**
   * Then error UIs should be visible
   */
  await wait(() => expect($fieldDef2Container.classList).toContain("errors"));

  expect($field2.classList).toContain("error");
  expect(getByTestId("form-control-error-2")).toBeInTheDocument();

  /**
   * And page should be scrolled up
   */
  expect(mockScrollTop).toHaveBeenCalled();

  /**
   * And error summary Ui should be visible on the page
   */
  const $errorSummary = getByTestId("graphql-errors-summary");

  /**
   * When we click on close button og errors summary
   */
  fireEvent.click($errorSummary.querySelector(".close.icon") as any);

  /**
   * Then error summary ui should no longer be visible on the page
   */
  expect(queryByTestId("graphql-errors-summary")).not.toBeInTheDocument();
});

it("renders errors if server returns title errors", async () => {
  const fieldDefs: CreateFieldDef[] = [
    {
      name: "Nice field",
      type: FieldType.SINGLE_LINE_TEXT
    }
  ];

  const { Ui, mockCreateExp } = makeComp();

  mockCreateExp.mockRejectedValue({
    graphQLErrors: [
      {
        // it's a JSON string
        message: `{
          "title":"awesome errors"
        }`
      }
    ]
  });

  /**
   * Given we are using new exp component
   */
  const {
    getByText,
    getByLabelText,
    getByTestId,
    queryByTestId,
    queryByText
  } = render(<Ui />);

  /**
   * When we complete the form
   */
  fillFields(getByLabelText, getByText, getByTestId, fieldDefs);

  /**
   * Then no error Uis should be visible
   */
  expect(queryByText(/title awesome errors/i)).not.toBeInTheDocument();
  expect(queryByTestId("form-control-error-0")).not.toBeInTheDocument();

  /**
   * When we submit the form
   */

  fireEvent.click(getByText("Submit"));

  /**
   * Then error UIs should be visible
   */
  await wait(() =>
    expect(getByText(/title awesome errors/i)).toBeInTheDocument()
  );

  expect(getByTestId("form-control-error-0")).toBeInTheDocument();

  /**
   * And page should be scrolled up
   */
  expect(mockScrollTop).toHaveBeenCalled();
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

  const { Ui } = makeComp();

  /**
   * Given we are using new exp component
   */
  const { getByText, getByLabelText, getByTestId, queryByText } = render(
    <Ui />
  );

  /**
   * When we complete two fields, but leaving name text box of field 2 empty
   */
  fillFields(getByLabelText, getByText, getByTestId, fieldDefs);

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

function makeComp(props: Partial<Props> = {}) {
  const mockCreateExp = jest.fn();

  const { Ui, ...rest } = renderWithRouter(
    ExperienceDefinitionP,
    {},
    {
      createExp: mockCreateExp,
      ...props
    }
  );

  return {
    Ui,
    mockCreateExp,
    ...rest
  };
}

function fillFields(
  getByLabelText: any,
  getByText: any,
  getByTestId: any,
  fieldDefs: CreateFieldDef[],
  description?: string
) {
  fillField(getByLabelText("Title"), title);
  const len = fieldDefs.length;

  fieldDefs.map((fieldDef, index) => {
    const index1 = index + 1;
    fillFieldDefinition(getByLabelText, getByText, fieldDef, index1);

    if (index1 < len) {
      fireEvent.click(getByTestId(`add-field-btn-${index1}`));
    }
  });
}

function fillFieldDefinition(
  getByLabelText: any,
  getByText: any,
  { name, type }: CreateFieldDef,
  index1: number
) {
  fillField(getByLabelText(`Field ${index1} Name`), name);

  fireEvent.click(selectDataType(getByText, `Field ${index1} Data Type`, type));
}

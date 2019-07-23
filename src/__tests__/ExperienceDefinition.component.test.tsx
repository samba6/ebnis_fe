/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { ComponentType } from "react";
import "react-testing-library/cleanup-after-each";
import { render, fireEvent, wait } from "react-testing-library";
import { waitForElement } from "dom-testing-library";
import { ExperienceDefinition } from "../components/ExperienceDefinition/component";
import { CreateFieldDef, FieldType } from "../graphql/apollo-types/globalTypes";
import { Props } from "../components/ExperienceDefinition/utils";
import { fillField, renderWithRouter, closeMessage } from "./test_utils";
import { makeExperienceRoute } from "../constants/experience-route";

jest.mock("../components/ExperienceDefinition/update");
jest.mock("../components/ExperienceDefinition/scrollTop");
jest.mock("../components/SidebarHeader", () => ({
  SidebarHeader: jest.fn(() => null),
}));
jest.mock("../state/connections");

import { ExperienceDefinitionUpdate } from "../components/ExperienceDefinition/update";
import { scrollTop } from "../components/ExperienceDefinition/scrollTop";
import { isConnected } from "../state/connections";

const mockScrollTop = scrollTop as jest.Mock;
const mockIsConnected = isConnected as jest.Mock;

const title = "my experience";

it("adds field from top", async () => {
  const fieldDefs: CreateFieldDef[] = [
    {
      name: "f0",
      type: FieldType.SINGLE_LINE_TEXT,
    },

    {
      name: "f1",
      type: FieldType.DATETIME,
    },
  ];

  const { Ui, mockNavigate, mockCreateExperience } = makeComp();

  mockCreateExperience.mockResolvedValue({
    data: {
      createExperience: {
        id: "expId1",
      },
    },
  });

  /**
   * Given we are using new experience component
   */
  render(<Ui />);

  /**
   * And we complete the title field
   */
  fillField(
    document.getElementById("experience-definition-title-input") as any,
    title,
  );

  /**
   * Then add button of field0 should not be visible
   */
  expect(document.getElementById("add-field-btn-0")).toBeNull();

  /**
   * When we complete field name field of field0
   */
  fillField(document.getElementById("field-name-0") as any, fieldDefs[0].name);

  /**
   * Then add button of field0 should not be visible
   */
  expect(document.getElementById("add-field-btn-0")).toBeNull();

  /**
   * When we complete data type field of field0
   */
  fireEvent.click((document.getElementById(
    "experience-definition-field-type-0",
  ) as HTMLDivElement).getElementsByClassName(
    `js-${fieldDefs[0].type}`,
  )[0] as any);

  /**
   * And remove button of field 0 should not be visible
   */
  expect(document.getElementById("remove-field-btn-0")).toBeNull();

  /**
   * And move down button of field 0 should not be visible
   */
  expect(document.getElementById("go-down-field-btn-0")).toBeNull();

  /**
   * And move up button of field 0 should not be visible
   */
  expect(document.getElementById("go-up-field-btn-0")).toBeNull();

  /**
   * And field 2 should not be visible
   */
  expect(
    document.getElementById("experience-field-definition-container-1"),
  ).toBeNull();

  /**
   * When we click on add button of field 0
   */
  fireEvent.click(document.getElementById("add-field-btn-0") as any);

  /**
   * Then remove button of field 0 should be visible
   */
  expect(document.getElementById("remove-field-btn-0")).not.toBeNull();

  /**
   * And move down button of field 0 should be visible
   */
  expect(document.getElementById("go-down-field-btn-0")).not.toBeNull();

  /**
   * And move up button of field 0 should not be visible
   */
  expect(document.getElementById("go-up-field-btn-0")).toBeNull();

  /**
   * And add button of field 1 should not be visible
   */
  expect(document.getElementById("add-field-btn-1")).toBeNull();

  /**
   * And remove button of field 1 should be visible
   */
  expect(document.getElementById("remove-field-btn-1")).not.toBeNull();

  /**
   * And move down button of field 1 should not be visible
   */
  expect(document.getElementById("go-down-field-btn-1")).toBeNull();

  /**
   * And move up button of field 1 should be visible
   */
  expect(document.getElementById("go-up-field-btn-1")).not.toBeNull();

  /**
   * When we complete name field of field 1
   */
  fillField(document.getElementById("field-name-1") as any, fieldDefs[1].name);

  /**
   * Then add button of field 1 should not be visible
   */
  expect(document.getElementById("add-field-btn-1")).toBeNull();

  /**
   * When we complete data type field of field 1
   */

  fireEvent.click((document.getElementById(
    "experience-definition-field-type-1",
  ) as HTMLDivElement).getElementsByClassName(
    `js-${fieldDefs[1].type}`,
  )[0] as any);

  /**
   * Then add button of field 1 should now be visible
   */
  expect(document.getElementById("add-field-btn-1") as any).not.toBeNull();

  /**
   * When we submit the form
   */
  fireEvent.click(document.getElementById(
    "experience-definition-submit-btn",
  ) as any);

  /**
   * Then correct data should be uploaded to the server
   */
  await wait(() =>
    expect(mockCreateExperience.mock.calls[0][0]).toMatchObject({
      variables: {
        createExperienceInput: {
          title,
          fieldDefs,
          description: "",
        },
      },
      update: ExperienceDefinitionUpdate,
    }),
  );

  /**
   * And we should be redirected away from the page
   */
  expect(mockNavigate).toBeCalledWith(makeExperienceRoute("expId1"));
});

it("adds field in middle", async () => {
  const fieldDefs: CreateFieldDef[] = [
    {
      name: "f0",
      type: FieldType.SINGLE_LINE_TEXT,
    },

    {
      name: "f1",
      type: FieldType.DATETIME,
    },

    {
      name: "f2",
      type: FieldType.INTEGER,
    },
  ];

  const { Ui, mockNavigate, mockCreateExperience } = makeComp();

  mockCreateExperience.mockResolvedValue({
    data: {
      createExperience: {
        id: "expId1",
      },
    },
  });

  /**
   * Given we are using new experience component
   */
  render(<Ui />);

  /**
   * And we create and complete 3 field definitions
   */
  fillFields(fieldDefs);

  /**
   * Then there should not be a field definition at position 3
   */
  expect(document.getElementById("field-name-3")).toBeNull();

  /**
   * When we click on add button of field 1
   */
  fireEvent.click(document.getElementById("add-field-btn-1") as any);

  /**
   * Then there should be an empty field at position 2
   */

  expect((document.getElementById("field-name-2") as any).value).toBe("");

  /**
   * And the field that was formerly at position 2 should now be at position 3
   */
  expect((document.getElementById("field-name-3") as any).value).toBe(
    fieldDefs[2].name,
  );

  /**
   * When we complete the new field and submit the form
   */
  fillFieldDefinition("f3", FieldType.DECIMAL, 2);

  fireEvent.click(document.getElementById(
    "experience-definition-submit-btn",
  ) as any);

  /**
   * Then correct data should be uploaded to the server
   */
  /**
   * And correct data should be sent to the server
   */
  await wait(() =>
    expect(mockCreateExperience.mock.calls[0][0]).toMatchObject({
      variables: {
        createExperienceInput: {
          title,
          fieldDefs: [
            fieldDefs[0],
            fieldDefs[1],
            {
              name: "f3",
              type: FieldType.DECIMAL,
            },
            fieldDefs[2],
          ],
          description: "",
        },
      },
      update: ExperienceDefinitionUpdate,
    }),
  );

  /**
   * And we should be redirected away from the page
   */
  expect(mockNavigate).toBeCalledWith(makeExperienceRoute("expId1"));
});

it("adds field at bottom", async () => {
  const fieldDefs: CreateFieldDef[] = [
    {
      name: "f0",
      type: FieldType.SINGLE_LINE_TEXT,
    },

    {
      name: "f1",
      type: FieldType.DATETIME,
    },
  ];

  const { Ui, mockNavigate, mockCreateExperience } = makeComp();

  mockCreateExperience.mockResolvedValue({
    data: {
      createExperience: {
        id: "expId1",
      },
    },
  });

  /**
   * Given we are using new experience component
   */
  render(<Ui />);

  /**
   * And we create and complete 2 field definitions
   */
  fillFields(fieldDefs);

  /**
   * Then there should not be a field definition at position 2
   */
  expect(document.getElementById("field-name-2")).toBeNull();

  /**
   * When we click on add button of field 1
   */
  fireEvent.click(document.getElementById("add-field-btn-1") as any);

  /**
   * Then there should be an empty field at position 2
   */
  expect((document.getElementById("field-name-2") as any).value).toBe("");

  /**
   * When we complete the new field and submit the form
   */

  fillFieldDefinition("f2", FieldType.DECIMAL, 2);

  fireEvent.click(document.getElementById(
    "experience-definition-submit-btn",
  ) as any);

  /**
   * Then correct data should be uploaded to the server
   */
  /**
   * And correct data should be sent to the server
   */
  await wait(() =>
    expect(mockCreateExperience.mock.calls[0][0]).toMatchObject({
      variables: {
        createExperienceInput: {
          title,
          fieldDefs: [
            fieldDefs[0],
            fieldDefs[1],
            { name: "f2", type: FieldType.DECIMAL },
          ],
          description: "",
        },
      },
      update: ExperienceDefinitionUpdate,
    }),
  );

  /**
   * And we should be redirected away from the page
   */
  expect(mockNavigate).toBeCalledWith(makeExperienceRoute("expId1"));
});

it("removes field from top", async () => {
  const fieldDefs: CreateFieldDef[] = [
    {
      name: "f0",
      type: FieldType.SINGLE_LINE_TEXT,
    },

    {
      name: "f1",
      type: FieldType.DATETIME,
    },
  ];

  const { Ui, mockNavigate, mockCreateExperience } = makeComp();

  mockCreateExperience.mockResolvedValue({
    data: {
      createExperience: {
        id: "expId1",
      },
    },
  });

  /**
   * Given we are using new experience component
   */
  render(<Ui />);

  /**
   * And we complete the two fields on screen
   */
  fillFields(fieldDefs);

  /**
   * And field 1 should have add, remove and up buttons
   */
  expect(document.getElementById("add-field-btn-1") as any).not.toBeNull();
  expect(document.getElementById("remove-field-btn-1")).not.toBeNull();
  expect(document.getElementById("go-up-field-btn-1")).not.toBeNull();

  /**
   * When we click on remove button of field 0
   */
  fireEvent.click(document.getElementById("remove-field-btn-0") as any);

  /**
   * And former field 1 should now be in position 0
   */
  expect((document.getElementById("field-name-0") as any).value).toBe("f1");

  /**
   * And its remove and move up buttons should no longer be visible
   */
  expect(document.getElementById("remove-field-btn-0")).toBeNull();
  expect(document.getElementById("go-up-field-btn-0")).toBeNull();

  /**
   * But its add button should be visible
   */
  expect(document.getElementById("add-field-btn-0") as any).not.toBeNull();

  /**
   * When we submit the form
   */
  fireEvent.click(document.getElementById(
    "experience-definition-submit-btn",
  ) as any);

  /**
   * Then correct data should be uploaded to the server
   */
  await wait(() =>
    expect(mockCreateExperience.mock.calls[0][0]).toMatchObject({
      variables: {
        createExperienceInput: {
          title,
          fieldDefs: [fieldDefs[1]],
          description: "",
        },
      },
      update: ExperienceDefinitionUpdate,
    }),
  );

  /**
   * And we should be redirected away from the page
   */
  expect(mockNavigate).toBeCalledWith(makeExperienceRoute("expId1"));
});

it("removes field from bottom", async () => {
  const fieldDefs: CreateFieldDef[] = [
    {
      name: "f0",
      type: FieldType.SINGLE_LINE_TEXT,
    },

    {
      name: "f1",
      type: FieldType.DATETIME,
    },
  ];

  const { Ui, mockCreateExperience } = makeComp();

  mockCreateExperience.mockResolvedValue({
    data: {
      createExperience: {
        id: "expId1",
      },
    },
  });

  /**
   * Given we are using new experience component
   */
  render(<Ui />);

  /**
   * And we complete the two fields on screen
   */
  fillFields(fieldDefs);

  /**
   * Then field 1 should be visible on the screen
   */
  expect(document.getElementById("field-name-1")).not.toBeNull();

  /**
   * And field 0 should have add, remove and down buttons
   */
  expect(document.getElementById("add-field-btn-0") as any).not.toBeNull();
  expect(document.getElementById("remove-field-btn-0")).not.toBeNull();
  expect(document.getElementById("go-down-field-btn-0")).not.toBeNull();

  /**
   * When we click on remove button of field 1
   */
  fireEvent.click(document.getElementById("remove-field-btn-1") as any);

  /**
   * Then field 1 should no longer be visible on the screen
   */
  expect(document.getElementById("field-name-1")).toBeNull();

  /**
   * And field 0's remove and move down buttons should no longer be visible
   */
  expect(document.getElementById("remove-field-btn-0")).toBeNull();

  expect(document.getElementById("go-down-field-btn-0")).toBeNull();

  /**
   * But its add button should be visible
   */
  expect(document.getElementById("add-field-btn-0") as any).not.toBeNull();

  /**
   * When we submit the form
   */
  fireEvent.click(document.getElementById(
    "experience-definition-submit-btn",
  ) as any);

  /**
   * Then correct data should be uploaded to the server
   */
  await wait(() =>
    expect(mockCreateExperience.mock.calls[0][0]).toMatchObject({
      variables: {
        createExperienceInput: {
          title,
          fieldDefs: [fieldDefs[0]],
          description: "",
        },
      },
      update: ExperienceDefinitionUpdate,
    }),
  );
});

it("removes field from middle", async () => {
  const fieldDefs: CreateFieldDef[] = [
    {
      name: "f0",
      type: FieldType.SINGLE_LINE_TEXT,
    },

    {
      name: "f1",
      type: FieldType.DATETIME,
    },

    {
      name: "f2",
      type: FieldType.DECIMAL,
    },
  ];

  const { Ui, mockCreateExperience } = makeComp();

  mockCreateExperience.mockResolvedValue({
    data: {
      createExperience: {
        id: "expId1",
      },
    },
  });

  /**
   * Given we are using new experience component
   */
  render(<Ui />);

  /**
   * And we complete the 3 fields on screen
   */
  fillFields(fieldDefs);

  /**
   * Then field 1 name should contain text for position 1
   */
  expect((document.getElementById("field-name-1") as any).value).toBe(
    fieldDefs[1].name,
  );

  /**
   * When we click on remove button of field 1
   */
  fireEvent.click(document.getElementById("remove-field-btn-1") as any);

  /**
   * Then field 1 name should now contain text formerly at position 2 because
   * former field 1 is no longer on the page and former field 2 has moved up to
   * position 1
   */
  expect((document.getElementById("field-name-1") as any).value).toBe(
    fieldDefs[2].name,
  );

  /**
   * When we submit the form
   */
  fireEvent.click(document.getElementById(
    "experience-definition-submit-btn",
  ) as any);

  /**
   * Then correct data should be uploaded to the server
   */
  await wait(() =>
    expect(mockCreateExperience.mock.calls[0][0]).toMatchObject({
      variables: {
        createExperienceInput: {
          title,
          fieldDefs: [fieldDefs[0], fieldDefs[2]],
          description: "",
        },
      },
      update: ExperienceDefinitionUpdate,
    }),
  );
});

it("moves field up from bottom", async () => {
  const fieldDefs: CreateFieldDef[] = [
    {
      name: "f0",
      type: FieldType.SINGLE_LINE_TEXT,
    },

    {
      name: "f1",
      type: FieldType.DATETIME,
    },
  ];

  const { Ui, mockCreateExperience } = makeComp();

  mockCreateExperience.mockResolvedValue({
    data: {
      createExperience: {
        id: "expId1",
      },
    },
  });

  /**
   * Given we are using new experience component
   */
  render(<Ui />);

  /**
   * And we complete the two fields on screen
   */
  fillFields(fieldDefs);

  /**
   * Then field 0 name should have text at position 0
   */
  expect((document.getElementById("field-name-0") as any).value).toBe(
    fieldDefs[0].name,
  );

  /**
   * And field 1 name should have text at position 1
   */
  expect((document.getElementById("field-name-1") as any).value).toBe(
    fieldDefs[1].name,
  );

  /**
   * When we click on move up button of field 1
   */
  fireEvent.click(document.getElementById("go-up-field-btn-1") as any);

  /**
   * Then field 0 name should have text at position 1 because it has moved up
   */
  expect((document.getElementById("field-name-0") as any).value).toBe(
    fieldDefs[1].name,
  );

  /**
   * And field 1 name should have text at position 0 because it has moved down
   */
  expect((document.getElementById("field-name-1") as any).value).toBe(
    fieldDefs[0].name,
  );

  /**
   * When we submit the form
   */
  fireEvent.click(document.getElementById(
    "experience-definition-submit-btn",
  ) as any);

  /**
   * Then correct data should be uploaded to the server
   */
  await wait(() =>
    expect(mockCreateExperience.mock.calls[0][0]).toMatchObject({
      variables: {
        createExperienceInput: {
          title,
          fieldDefs: [fieldDefs[1], fieldDefs[0]],
          description: "",
        },
      },
      update: ExperienceDefinitionUpdate,
    }),
  );
});

it("moves field up from middle", async () => {
  const fieldDefs: CreateFieldDef[] = [
    {
      name: "f0",
      type: FieldType.SINGLE_LINE_TEXT,
    },

    {
      name: "f1",
      type: FieldType.DATETIME,
    },

    {
      name: "f2",
      type: FieldType.DATETIME,
    },
  ];

  const { Ui, mockCreateExperience } = makeComp();

  mockCreateExperience.mockResolvedValue({
    data: {
      createExperience: {
        id: "expId1",
      },
    },
  });

  /**
   * Given we are using new experience component
   */
  render(<Ui />);

  /**
   * And we complete the two fields on screen
   */
  fillFields(fieldDefs);

  /**
   * Then field 0 name should have text at position 0
   */
  expect((document.getElementById("field-name-0") as any).value).toBe(
    fieldDefs[0].name,
  );

  /**
   * And field 1 name should have text at position 1
   */
  expect((document.getElementById("field-name-1") as any).value).toBe(
    fieldDefs[1].name,
  );

  /**
   * When we click on move up button of field 1
   */
  fireEvent.click(document.getElementById("go-up-field-btn-1") as any);

  /**
   * Then field 0 name should have text at position 1 because it has moved up
   */
  expect((document.getElementById("field-name-0") as any).value).toBe(
    fieldDefs[1].name,
  );

  /**
   * And field 1 name should have text at position 0 because it has moved down
   */
  expect((document.getElementById("field-name-1") as any).value).toBe(
    fieldDefs[0].name,
  );

  /**
   * When we submit the form
   */
  fireEvent.click(document.getElementById(
    "experience-definition-submit-btn",
  ) as any);

  /**
   * Then correct data should be uploaded to the server
   */
  await wait(() =>
    expect(mockCreateExperience.mock.calls[0][0]).toMatchObject({
      variables: {
        createExperienceInput: {
          title,
          fieldDefs: [fieldDefs[1], fieldDefs[0], fieldDefs[2]],
          description: "",
        },
      },
      update: ExperienceDefinitionUpdate,
    }),
  );
});

it("moves field down from top", async () => {
  const fieldDefs: CreateFieldDef[] = [
    {
      name: "f0",
      type: FieldType.SINGLE_LINE_TEXT,
    },

    {
      name: "f1",
      type: FieldType.DATETIME,
    },
  ];

  const { Ui, mockCreateExperience } = makeComp();

  mockCreateExperience.mockResolvedValue({
    data: {
      createExperience: {
        id: "expId1",
      },
    },
  });

  /**
   * Given we are using new experience component
   */
  render(<Ui />);

  /**
   * And we complete the two fields on screen
   */
  fillFields(fieldDefs);

  /**
   * Then field 0 name should have text at position 0
   */
  expect((document.getElementById("field-name-0") as any).value).toBe(
    fieldDefs[0].name,
  );

  /**
   * And field 1 name should have text at position 1
   */
  expect((document.getElementById("field-name-1") as any).value).toBe(
    fieldDefs[1].name,
  );

  /**
   * When we click on move down button of field 0
   */
  fireEvent.click(document.getElementById("go-down-field-btn-0") as any);

  /**
   * Then field 0 name should have text at position 1 because it has moved up
   */
  expect((document.getElementById("field-name-0") as any).value).toBe(
    fieldDefs[1].name,
  );

  /**
   * And field 1 name should have text at position 0 because it has moved down
   */
  expect((document.getElementById("field-name-1") as any).value).toBe(
    fieldDefs[0].name,
  );

  /**
   * When we submit the form
   */
  fireEvent.click(document.getElementById(
    "experience-definition-submit-btn",
  ) as any);

  /**
   * Then correct data should be uploaded to the server
   */
  await wait(() =>
    expect(mockCreateExperience.mock.calls[0][0]).toMatchObject({
      variables: {
        createExperienceInput: {
          title,
          fieldDefs: [fieldDefs[1], fieldDefs[0]],
          description: "",
        },
      },
      update: ExperienceDefinitionUpdate,
    }),
  );
});

it("moves field down from middle", async () => {
  const fieldDefs: CreateFieldDef[] = [
    {
      name: "f0",
      type: FieldType.SINGLE_LINE_TEXT,
    },

    {
      name: "f1",
      type: FieldType.DATETIME,
    },

    {
      name: "f2",
      type: FieldType.DATETIME,
    },
  ];

  const { Ui, mockCreateExperience } = makeComp();

  mockCreateExperience.mockResolvedValue({
    data: {
      createExperience: {
        id: "expId1",
      },
    },
  });

  /**
   * Given we are using new experience component
   */
  render(<Ui />);

  /**
   * And we complete the 3 fields on screen
   */
  fillFields(fieldDefs);

  /**
   * Then field 1 name should have text at position 1
   */
  expect((document.getElementById("field-name-1") as any).value).toBe(
    fieldDefs[1].name,
  );

  /**
   * And field 2 name should have text at position 2
   */
  expect((document.getElementById("field-name-2") as any).value).toBe(
    fieldDefs[2].name,
  );

  /**
   * When we click on move down button of field 1
   */
  fireEvent.click(document.getElementById("go-down-field-btn-1") as any);

  /**
   * Then field 1 name should have text at position 2 because it has moved up
   */
  expect((document.getElementById("field-name-1") as any).value).toBe(
    fieldDefs[2].name,
  );

  /**
   * Then field 2 name should have text at position 1 because it has moved down
   */
  expect((document.getElementById("field-name-2") as any).value).toBe(
    fieldDefs[1].name,
  );

  /**
   * When we submit the form
   */
  fireEvent.click(document.getElementById(
    "experience-definition-submit-btn",
  ) as any);

  /**
   * Then correct data should be uploaded to the server
   */
  await wait(() =>
    expect(mockCreateExperience.mock.calls[0][0]).toMatchObject({
      variables: {
        createExperienceInput: {
          title,
          fieldDefs: [fieldDefs[0], fieldDefs[2], fieldDefs[1]],
          description: "",
        },
      },
      update: ExperienceDefinitionUpdate,
    }),
  );
});

it("toggles description field", () => {
  const { Ui } = makeComp();

  /**
   * Given we are using new experience component
   */
  render(<Ui />);

  /**
   * Then description input box should be visible on the page
   */
  expect(
    document.getElementById("experience-definition-description-input"),
  ).not.toBeNull();

  /**
   * And an icon indicating that description is showing should be visible on
   * the page
   */
  expect(
    document.getElementById("experience-definition-description-visible-icon"),
  ).not.toBeNull();

  /**
   * And an icon indicating that description is not showing should not be
   * visible on the page
   */
  expect(
    document.getElementById(
      "experience-definition-description-not-visible-icon",
    ),
  ).toBeNull();

  /**
   * When we click on the description label
   */
  fireEvent.click(document.getElementById(
    "experience-definition-description-toggle",
  ) as any);

  /**
   * Then description input box should no longer be visible on the page
   */
  expect(
    document.getElementById("experience-definition-description-input"),
  ).toBeNull();

  /**
   * And an icon indicating that description is not showing should be visible on
   * the page
   */
  expect(
    document.getElementById(
      "experience-definition-description-not-visible-icon",
    ),
  ).not.toBeNull();

  /**
   * And an icon indicating that description is showing should not be
   * visible on the page
   */
  expect(
    document.getElementById("experience-definition-description-visible-icon"),
  ).toBeNull();
});

it("renders errors if server returns field defs errors", async () => {
  const fieldDefs: CreateFieldDef[] = [
    {
      name: "Nice field",
      type: FieldType.SINGLE_LINE_TEXT,
    },

    {
      name: "Nice field",
      type: FieldType.DATETIME,
    },
  ];

  const { Ui, mockCreateExperience } = makeComp();

  mockCreateExperience.mockRejectedValue({
    graphQLErrors: [
      {
        // it's a JSON string
        message: `{
          "field_defs":[
            {"name":"${fieldDefs[1].name}---1 has already been taken"}
          ],
          "title":"has already been taken"
        }`,
      },
    ],
  });

  /**
   * Given we are using new exp component
   */
  render(<Ui />);

  /**
   * When we complete two fields, giving them same name
   */
  fillFields(fieldDefs);

  /**
   * Then no error Uis should be visible
   */
  const $fieldDef1Container = document.getElementById(
    "experience-field-definition-container-1",
  ) as HTMLDivElement;

  expect($fieldDef1Container.classList).not.toContain("errors");

  const $field1 = $fieldDef1Container.querySelector(".field") as HTMLDivElement;

  expect($field1.classList).not.toContain("error");

  expect(document.getElementById("field-name-1-error")).toBeNull();

  expect(
    document.getElementById("experience-definition-title-error"),
  ).toBeNull();

  /**
   * When we submit the form
   */

  fireEvent.click(document.getElementById(
    "experience-definition-submit-btn",
  ) as any);

  /**
   * Then error UIs should be visible
   */
  await wait(() => expect($fieldDef1Container.classList).toContain("errors"));

  expect($field1.classList).toContain("error");

  expect(document.getElementById("field-name-1-error")).not.toBeNull();

  expect(
    document.getElementById("experience-definition-title-error"),
  ).not.toBeNull();

  /**
   * And page should be scrolled up
   */
  expect(mockScrollTop).toHaveBeenCalled();

  /**
   * And error summary Ui should be visible on the page. And when we click on it
   */

  closeMessage(
    document.getElementById("experience-definition-graphql-errors-summary"),
  );

  /**
   * Then error summary ui should no longer be visible on the page
   */
  expect(
    document.getElementById("experience-definition-graphql-errors-summary"),
  ).toBeNull();
});

it("renders error if all fields not completely filled on submission", async () => {
  const fieldDefs: CreateFieldDef[] = [
    {
      name: "Nice field",
      type: FieldType.SINGLE_LINE_TEXT,
    },

    {
      name: "",
      type: FieldType.DATETIME,
    },
  ];

  const { Ui } = makeComp();

  /**
   * Given we are using new exp component
   */
  render(<Ui />);

  /**
   * When we complete two fields, but leaving name text box of field 2 empty
   */
  fillFields(fieldDefs);

  /**
   * Then no error Uis should be visible
   */
  const $fieldDef1Container = document.getElementById(
    "experience-field-definition-container-1",
  ) as HTMLDivElement;

  expect($fieldDef1Container.classList).not.toContain("errors");

  const $field1 = $fieldDef1Container.querySelector(".field") as HTMLDivElement;

  expect($field1.classList).not.toContain("error");

  /**
   * When we submit the form
   */

  fireEvent.click(document.getElementById(
    "experience-definition-submit-btn",
  ) as any);

  /**
   * Then error UIs should be visible
   */
  await wait(() => expect($fieldDef1Container.classList).toContain("errors"));

  expect($field1.classList).toContain("error");
});

it("saves experience when we are not connected", async () => {
  const fieldDefs: CreateFieldDef[] = [
    {
      name: "f0",
      type: FieldType.SINGLE_LINE_TEXT,
    },

    {
      name: "f1",
      type: FieldType.DATETIME,
    },
  ];

  /**
   * Given server is not connected
   */
  const { Ui, mockNavigate, mockCreateUnsavedExperience } = makeComp(
    {},
    {
      isConnected: false,
    },
  );

  mockCreateUnsavedExperience.mockResolvedValue({
    data: {
      createUnsavedExperience: {
        id: "expId1",
      },
    },
  });

  /**
   * While we are using new experience component
   */
  render(<Ui />);

  /**
   * When we complete and submit the form
   */
  fillFields(fieldDefs);

  fireEvent.click(document.getElementById(
    "experience-definition-submit-btn",
  ) as any);

  /**
   * Then correct data should be uploaded to the server
   */
  await wait(() =>
    expect(mockCreateUnsavedExperience).toBeCalledWith({
      variables: {
        createExperienceInput: {
          title,
          fieldDefs,
          description: "",
        },
      },
    }),
  );

  /**
   * And we should be redirected away from the page
   */
  expect(mockNavigate).toBeCalledWith(makeExperienceRoute("expId1"));
});

it("renders error even if there are no fields error", async () => {
  const fieldDefs: CreateFieldDef[] = [
    {
      name: "12",
      type: FieldType.SINGLE_LINE_TEXT,
    },
  ];

  const { Ui } = makeComp();

  /**
   * Given we are using new exp component
   */
  render(<Ui />);

  /**
   * When we complete the form but with invalid title
   */
  fillFields(fieldDefs, { title: "a" });

  /**
   * Then no error Uis should be visible
   */
  let $titleError = document.getElementById(
    "experience-definition-title-error",
  );

  expect($titleError).toBeNull();

  /**
   * When we submit the form
   */

  fireEvent.click(document.getElementById(
    "experience-definition-submit-btn",
  ) as any);

  /**
   * Then error UIs should be visible
   */
  $titleError = await waitForElement(() =>
    document.getElementById("experience-definition-title-error"),
  );

  expect($titleError).not.toBeNull();
});

////////////////////////// HELPER FUNCTIONS ///////////////////////////

const ExperienceDefinitionP = ExperienceDefinition as ComponentType<
  Partial<Props>
>;

function makeComp(
  props: Partial<Props> = {},
  { isConnected = true }: { isConnected?: boolean } = {},
) {
  const mockCreateExperience = jest.fn();
  mockIsConnected.mockReset();
  mockIsConnected.mockReturnValue(isConnected);
  const mockCreateUnsavedExperience = jest.fn();

  const { Ui, ...rest } = renderWithRouter(
    ExperienceDefinitionP,
    {},
    {
      createExperience: mockCreateExperience,
      createUnsavedExperience: mockCreateUnsavedExperience,
      ...props,
    },
  );

  return {
    Ui,
    mockCreateExperience,
    mockCreateUnsavedExperience,
    ...rest,
  };
}

function fillFields(
  fieldDefs: CreateFieldDef[],
  fieldData: { title?: string } = {},
) {
  fillField(
    document.getElementById("experience-definition-title-input") as any,
    fieldData.title || title,
  );

  const len = fieldDefs.length;

  fieldDefs.map(({ type, name }, index) => {
    fillFieldDefinition(name, type, index);

    if (index + 1 < len) {
      fireEvent.click(document.getElementById(`add-field-btn-${index}`) as any);
    }
  });
}

function fillFieldDefinition(name: string, type: string, index: number) {
  fillField(document.getElementById(`field-name-${index}`) as any, name);

  fireEvent.click((document.getElementById(
    `experience-definition-field-type-${index}`,
  ) as HTMLElement).getElementsByClassName(`js-${type}`)[0] as any);
}

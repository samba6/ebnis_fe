/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { ComponentType } from "react";
import "@marko/testing-library/cleanup-after-each";
import {
  render,
  fireEvent,
  wait,
  waitForElement,
} from "@testing-library/react";
import { ExperienceDefinition } from "../components/ExperienceDefinition/experience-definition.component";
import {
  CreateDataDefinition,
  DataTypes,
} from "../graphql/apollo-types/globalTypes";
import { Props } from "../components/ExperienceDefinition/experience-definition.utils";
import { fillField, renderWithRouter, closeMessage } from "./test_utils";
import { makeExperienceRoute } from "../constants/experience-route";
import {
  CreateExperienceMutationVariables,
  CreateExperienceMutation,
} from "../graphql/apollo-types/CreateExperienceMutation";
import { isConnected } from "../state/connections";
import { scrollIntoView } from "../components/scroll-into-view";
import { CreateOfflineExperienceMutationData } from "../components/ExperienceDefinition/experience-definition.resolvers";
import { ApolloError } from "apollo-client";
import { GraphQLError } from "graphql";
import { EbnisAppProvider } from "../context";
import {
  useCreateExperience,
  addResolvers,
  useCreateUnsavedExperience,
  ExperienceDefinitionUpdate,
} from "../components/ExperienceDefinition/experience-definition.injectables";

jest.mock("../state/connections");
jest.mock("../components/scroll-into-view");
jest.mock(
  "../components/ExperienceDefinition/experience-definition.injectables",
);
jest.mock("@apollo/react-hooks");
jest.mock("../components/SidebarHeader/sidebar-header.component", () => ({
  SidebarHeader: jest.fn(() => null),
}));

jest.mock("../components/use-delete-cached-queries-mutations-on-unmount");

const mockIsConnected = isConnected as jest.Mock;
const mockScrollIntoView = scrollIntoView as jest.Mock;
const mockUseCreateExperience = useCreateExperience as jest.Mock;
const mockUseCreateUnsavedExperience = useCreateUnsavedExperience as jest.Mock;
const mockAddResolvers = addResolvers as jest.Mock;

beforeEach(() => {
  mockIsConnected.mockReset();
  mockScrollIntoView.mockReset();
  mockUseCreateExperience.mockReset();
  mockAddResolvers.mockReset();
  mockUseCreateUnsavedExperience.mockReset();
});

const title = "ab";

const resolvedVal = {
  data: {
    createExperience: {
      experience: { id: "1" },
    },
  } as CreateExperienceMutation,
};

it("adds field from top, creates online experience definition", async () => {
  const dataDefinitions: CreateDataDefinition[] = [
    {
      name: "f0",
      type: DataTypes.SINGLE_LINE_TEXT,
    },

    {
      name: "f1",
      type: DataTypes.DATETIME,
    },
  ];

  const { ui, mockNavigate, mockCreateExperience } = makeComp();

  mockCreateExperience.mockResolvedValue(resolvedVal);

  /**
   * Given we are using new experience component
   */
  render(ui);

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
  expect(document.getElementById("add-definition-btn-0")).toBeNull();

  /**
   * When we complete field name field of field0
   */
  fillField(
    document.getElementById("field-name-0") as any,
    dataDefinitions[0].name,
  );

  /**
   * Then add button of field0 should not be visible
   */
  expect(document.getElementById("add-definition-btn-0")).toBeNull();

  /**
   * When we complete data type field of field0
   */
  fireEvent.click((document.getElementById(
    "experience-data-type-0",
  ) as HTMLDivElement).getElementsByClassName(
    `js-${dataDefinitions[0].type}`,
  )[0] as any);

  /**
   * And remove button of field 0 should not be visible
   */
  expect(document.getElementById("remove-definition-btn---0")).toBeNull();

  /**
   * And move down button of field 0 should not be visible
   */
  expect(document.getElementById("definition-go-down-btn-0")).toBeNull();

  /**
   * And move up button of field 0 should not be visible
   */
  expect(document.getElementById("definition-go-up-btn-0")).toBeNull();

  /**
   * And field 2 should not be visible
   */
  expect(
    document.getElementById("experience-definition-container-1"),
  ).toBeNull();

  /**
   * When we click on add button of field 0
   */
  fireEvent.click(document.getElementById("add-definition-btn-0") as any);

  /**
   * Then remove button of field 0 should be visible
   */
  expect(document.getElementById("remove-definition-btn---0")).not.toBeNull();

  /**
   * And move down button of field 0 should be visible
   */
  expect(document.getElementById("definition-go-down-btn-0")).not.toBeNull();

  /**
   * And move up button of field 0 should not be visible
   */
  expect(document.getElementById("definition-go-up-btn-0")).toBeNull();

  /**
   * And add button of field 1 should not be visible
   */
  expect(document.getElementById("add-definition-btn-1")).toBeNull();

  /**
   * And remove button of field 1 should be visible
   */
  expect(document.getElementById("remove-definition-btn---1")).not.toBeNull();

  /**
   * And move down button of field 1 should not be visible
   */
  expect(document.getElementById("definition-go-down-btn-1")).toBeNull();

  /**
   * And move up button of field 1 should be visible
   */
  expect(document.getElementById("definition-go-up-btn-1")).not.toBeNull();

  /**
   * When we complete name field of field 1
   */
  fillField(
    document.getElementById("field-name-1") as any,
    dataDefinitions[1].name,
  );

  /**
   * Then add button of field 1 should not be visible
   */
  expect(document.getElementById("add-definition-btn-1")).toBeNull();

  /**
   * When we complete data type field of field 1
   */

  fireEvent.click((document.getElementById(
    "experience-data-type-1",
  ) as HTMLDivElement).getElementsByClassName(
    `js-${dataDefinitions[1].type}`,
  )[0] as any);

  /**
   * Then add button of field 1 should now be visible
   */
  expect(document.getElementById("add-definition-btn-1") as any).not.toBeNull();

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
          dataDefinitions,
          description: "",
        },
      } as CreateExperienceMutationVariables,
      update: ExperienceDefinitionUpdate,
    }),
  );

  /**
   * And we should be redirected away from the page
   */
  expect(mockNavigate).toBeCalledWith(makeExperienceRoute("1"));
});

it("adds field in middle", async () => {
  const dataDefinitions: CreateDataDefinition[] = [
    {
      name: "f0",
      type: DataTypes.SINGLE_LINE_TEXT,
    },

    {
      name: "f1",
      type: DataTypes.DATETIME,
    },

    {
      name: "f2",
      type: DataTypes.INTEGER,
    },
  ];

  const { ui, mockNavigate, mockCreateExperience } = makeComp();

  mockCreateExperience.mockResolvedValue(resolvedVal);

  /**
   * Given we are using new experience component
   */
  render(ui);

  /**
   * And we create and complete 3 field definitions
   */
  fillFields(dataDefinitions);

  /**
   * Then there should not be a field definition at position 3
   */
  expect(document.getElementById("field-name-3")).toBeNull();

  /**
   * When we click on add button of field 1
   */
  fireEvent.click(document.getElementById("add-definition-btn-1") as any);

  /**
   * Then there should be an empty field at position 2
   */

  expect((document.getElementById("field-name-2") as any).value).toBe("");

  /**
   * And the field that was formerly at position 2 should now be at position 3
   */
  expect((document.getElementById("field-name-3") as any).value).toBe(
    dataDefinitions[2].name,
  );

  /**
   * When we complete the new field and submit the form
   */
  fillFieldDefinition("f3", DataTypes.DECIMAL, 2);

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
          dataDefinitions: [
            dataDefinitions[0],
            dataDefinitions[1],
            {
              name: "f3",
              type: DataTypes.DECIMAL,
            },
            dataDefinitions[2],
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
  expect(mockNavigate).toBeCalledWith(makeExperienceRoute("1"));
});

it("adds field at bottom", async () => {
  const dataDefinitions: CreateDataDefinition[] = [
    {
      name: "f0",
      type: DataTypes.SINGLE_LINE_TEXT,
    },

    {
      name: "f1",
      type: DataTypes.DATETIME,
    },
  ];

  const { ui, mockNavigate, mockCreateExperience } = makeComp();

  mockCreateExperience.mockResolvedValue(resolvedVal);

  /**
   * Given we are using new experience component
   */
  render(ui);

  /**
   * And we create and complete 2 field definitions
   */
  fillFields(dataDefinitions);

  /**
   * Then there should not be a field definition at position 2
   */
  expect(document.getElementById("field-name-2")).toBeNull();

  /**
   * When we click on add button of field 1
   */
  fireEvent.click(document.getElementById("add-definition-btn-1") as any);

  /**
   * Then there should be an empty field at position 2
   */
  expect((document.getElementById("field-name-2") as any).value).toBe("");

  /**
   * When we complete the new field and submit the form
   */

  fillFieldDefinition("f2", DataTypes.DECIMAL, 2);

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
          dataDefinitions: [
            dataDefinitions[0],
            dataDefinitions[1],
            { name: "f2", type: DataTypes.DECIMAL },
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
  expect(mockNavigate).toBeCalledWith(makeExperienceRoute("1"));
});

it("removes field from top", async () => {
  const dataDefinitions: CreateDataDefinition[] = [
    {
      name: "f0",
      type: DataTypes.SINGLE_LINE_TEXT,
    },

    {
      name: "f1",
      type: DataTypes.DATETIME,
    },
  ];

  const { ui, mockNavigate, mockCreateExperience } = makeComp();

  mockCreateExperience.mockResolvedValue(resolvedVal);

  /**
   * Given we are using new experience component
   */
  render(ui);

  /**
   * And we complete the two fields on screen
   */
  fillFields(dataDefinitions);

  /**
   * And field 1 should have add, remove and up buttons
   */
  expect(document.getElementById("add-definition-btn-1") as any).not.toBeNull();
  expect(document.getElementById("remove-definition-btn---1")).not.toBeNull();
  expect(document.getElementById("definition-go-up-btn-1")).not.toBeNull();

  /**
   * When we click on remove button of field 0
   */
  fireEvent.click(document.getElementById("remove-definition-btn---0") as any);

  /**
   * And former field 1 should now be in position 0
   */
  expect((document.getElementById("field-name-0") as any).value).toBe("f1");

  /**
   * And its remove and move up buttons should no longer be visible
   */
  expect(document.getElementById("remove-definition-btn---0")).toBeNull();
  expect(document.getElementById("definition-go-up-btn-0")).toBeNull();

  /**
   * But its add button should be visible
   */
  expect(document.getElementById("add-definition-btn-0") as any).not.toBeNull();

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
          dataDefinitions: [dataDefinitions[1]],
          description: "",
        },
      },
      update: ExperienceDefinitionUpdate,
    }),
  );

  /**
   * And we should be redirected away from the page
   */
  expect(mockNavigate).toBeCalledWith(makeExperienceRoute("1"));
});

it("removes field from bottom", async () => {
  const dataDefinitions: CreateDataDefinition[] = [
    {
      name: "f0",
      type: DataTypes.SINGLE_LINE_TEXT,
    },

    {
      name: "f1",
      type: DataTypes.DATETIME,
    },
  ];

  const { ui, mockCreateExperience } = makeComp();

  mockCreateExperience.mockResolvedValue(resolvedVal);

  /**
   * Given we are using new experience component
   */
  render(ui);

  /**
   * And we complete the two fields on screen
   */
  fillFields(dataDefinitions);

  /**
   * Then field 1 should be visible on the screen
   */
  expect(document.getElementById("field-name-1")).not.toBeNull();

  /**
   * And field 0 should have add, remove and down buttons
   */
  expect(document.getElementById("add-definition-btn-0") as any).not.toBeNull();
  expect(document.getElementById("remove-definition-btn---0")).not.toBeNull();
  expect(document.getElementById("definition-go-down-btn-0")).not.toBeNull();

  /**
   * When we click on remove button of field 1
   */
  fireEvent.click(document.getElementById("remove-definition-btn---1") as any);

  /**
   * Then field 1 should no longer be visible on the screen
   */
  expect(document.getElementById("field-name-1")).toBeNull();

  /**
   * And field 0's remove and move down buttons should no longer be visible
   */
  expect(document.getElementById("remove-definition-btn---0")).toBeNull();

  expect(document.getElementById("definition-go-down-btn-0")).toBeNull();

  /**
   * But its add button should be visible
   */
  expect(document.getElementById("add-definition-btn-0") as any).not.toBeNull();

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
          dataDefinitions: [dataDefinitions[0]],
          description: "",
        },
      },
      update: ExperienceDefinitionUpdate,
    }),
  );
});

it("removes field from middle", async () => {
  const dataDefinitions: CreateDataDefinition[] = [
    {
      name: "f0",
      type: DataTypes.SINGLE_LINE_TEXT,
    },

    {
      name: "f1",
      type: DataTypes.DATETIME,
    },

    {
      name: "f2",
      type: DataTypes.DECIMAL,
    },
  ];

  const { ui, mockCreateExperience } = makeComp();

  mockCreateExperience.mockResolvedValue(resolvedVal);

  /**
   * Given we are using new experience component
   */
  render(ui);

  /**
   * And we complete the 3 fields on screen
   */
  fillFields(dataDefinitions);

  /**
   * Then field 1 name should contain text for position 1
   */
  expect((document.getElementById("field-name-1") as any).value).toBe(
    dataDefinitions[1].name,
  );

  /**
   * When we click on remove button of field 1
   */
  fireEvent.click(document.getElementById("remove-definition-btn---1") as any);

  /**
   * Then field 1 name should now contain text formerly at position 2 because
   * former field 1 is no longer on the page and former field 2 has moved up to
   * position 1
   */
  expect((document.getElementById("field-name-1") as any).value).toBe(
    dataDefinitions[2].name,
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
          dataDefinitions: [dataDefinitions[0], dataDefinitions[2]],
          description: "",
        },
      } as CreateExperienceMutationVariables,
      update: ExperienceDefinitionUpdate,
    }),
  );
});

it("moves field up from bottom", async () => {
  const dataDefinitions: CreateDataDefinition[] = [
    {
      name: "f0",
      type: DataTypes.SINGLE_LINE_TEXT,
    },

    {
      name: "f1",
      type: DataTypes.DATETIME,
    },
  ];

  const { ui, mockCreateExperience } = makeComp();

  mockCreateExperience.mockResolvedValue(resolvedVal);

  /**
   * Given we are using new experience component
   */
  render(ui);

  /**
   * And we complete the two fields on screen
   */
  fillFields(dataDefinitions);

  /**
   * Then field 0 name should have text at position 0
   */
  expect((document.getElementById("field-name-0") as any).value).toBe(
    dataDefinitions[0].name,
  );

  /**
   * And field 1 name should have text at position 1
   */
  expect((document.getElementById("field-name-1") as any).value).toBe(
    dataDefinitions[1].name,
  );

  /**
   * When we click on move up button of field 1
   */
  fireEvent.click(document.getElementById("definition-go-up-btn-1") as any);

  /**
   * Then field 0 name should have text at position 1 because it has moved up
   */
  expect((document.getElementById("field-name-0") as any).value).toBe(
    dataDefinitions[1].name,
  );

  /**
   * And field 1 name should have text at position 0 because it has moved down
   */
  expect((document.getElementById("field-name-1") as any).value).toBe(
    dataDefinitions[0].name,
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
          dataDefinitions: [dataDefinitions[1], dataDefinitions[0]],
          description: "",
        },
      },
      update: ExperienceDefinitionUpdate,
    }),
  );
});

it("moves field up from middle", async () => {
  const dataDefinitions: CreateDataDefinition[] = [
    {
      name: "f0",
      type: DataTypes.SINGLE_LINE_TEXT,
    },

    {
      name: "f1",
      type: DataTypes.DATETIME,
    },

    {
      name: "f2",
      type: DataTypes.DATETIME,
    },
  ];

  const { ui, mockCreateExperience } = makeComp();

  mockCreateExperience.mockResolvedValue(resolvedVal);

  /**
   * Given we are using new experience component
   */
  render(ui);

  /**
   * And we complete the two fields on screen
   */
  fillFields(dataDefinitions);

  /**
   * Then field 0 name should have text at position 0
   */
  expect((document.getElementById("field-name-0") as any).value).toBe(
    dataDefinitions[0].name,
  );

  /**
   * And field 1 name should have text at position 1
   */
  expect((document.getElementById("field-name-1") as any).value).toBe(
    dataDefinitions[1].name,
  );

  /**
   * When we click on move up button of field 1
   */
  fireEvent.click(document.getElementById("definition-go-up-btn-1") as any);

  /**
   * Then field 0 name should have text at position 1 because it has moved up
   */
  expect((document.getElementById("field-name-0") as any).value).toBe(
    dataDefinitions[1].name,
  );

  /**
   * And field 1 name should have text at position 0 because it has moved down
   */
  expect((document.getElementById("field-name-1") as any).value).toBe(
    dataDefinitions[0].name,
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
          dataDefinitions: [
            dataDefinitions[1],
            dataDefinitions[0],
            dataDefinitions[2],
          ],
          description: "",
        },
      },
      update: ExperienceDefinitionUpdate,
    }),
  );
});

it("moves field down from top", async () => {
  const dataDefinitions: CreateDataDefinition[] = [
    {
      name: "f0",
      type: DataTypes.SINGLE_LINE_TEXT,
    },

    {
      name: "f1",
      type: DataTypes.DATETIME,
    },
  ];

  const { ui, mockCreateExperience } = makeComp();

  mockCreateExperience.mockResolvedValue(resolvedVal);

  /**
   * Given we are using new experience component
   */
  render(ui);

  /**
   * And we complete the two fields on screen
   */
  fillFields(dataDefinitions);

  /**
   * Then field 0 name should have text at position 0
   */
  expect((document.getElementById("field-name-0") as any).value).toBe(
    dataDefinitions[0].name,
  );

  /**
   * And field 1 name should have text at position 1
   */
  expect((document.getElementById("field-name-1") as any).value).toBe(
    dataDefinitions[1].name,
  );

  /**
   * When we click on move down button of field 0
   */
  fireEvent.click(document.getElementById("definition-go-down-btn-0") as any);

  /**
   * Then field 0 name should have text at position 1 because it has moved up
   */
  expect((document.getElementById("field-name-0") as any).value).toBe(
    dataDefinitions[1].name,
  );

  /**
   * And field 1 name should have text at position 0 because it has moved down
   */
  expect((document.getElementById("field-name-1") as any).value).toBe(
    dataDefinitions[0].name,
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
          dataDefinitions: [dataDefinitions[1], dataDefinitions[0]],
          description: "",
        },
      },
      update: ExperienceDefinitionUpdate,
    }),
  );
});

it("moves field down from middle", async () => {
  const dataDefinitions: CreateDataDefinition[] = [
    {
      name: "f0",
      type: DataTypes.SINGLE_LINE_TEXT,
    },

    {
      name: "f1",
      type: DataTypes.DATETIME,
    },

    {
      name: "f2",
      type: DataTypes.DATETIME,
    },
  ];

  const { ui, mockCreateExperience } = makeComp();

  mockCreateExperience.mockResolvedValue(resolvedVal);

  /**
   * Given we are using new experience component
   */
  render(ui);

  /**
   * And we complete the 3 fields on screen
   */
  fillFields(dataDefinitions);

  /**
   * Then field 1 name should have text at position 1
   */
  expect((document.getElementById("field-name-1") as any).value).toBe(
    dataDefinitions[1].name,
  );

  /**
   * And field 2 name should have text at position 2
   */
  expect((document.getElementById("field-name-2") as any).value).toBe(
    dataDefinitions[2].name,
  );

  /**
   * When we click on move down button of field 1
   */
  fireEvent.click(document.getElementById("definition-go-down-btn-1") as any);

  /**
   * Then field 1 name should have text at position 2 because it has moved up
   */
  expect((document.getElementById("field-name-1") as any).value).toBe(
    dataDefinitions[2].name,
  );

  /**
   * Then field 2 name should have text at position 1 because it has moved down
   */
  expect((document.getElementById("field-name-2") as any).value).toBe(
    dataDefinitions[1].name,
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
          dataDefinitions: [
            dataDefinitions[0],
            dataDefinitions[2],
            dataDefinitions[1],
          ],
          description: "",
        },
      },
      update: ExperienceDefinitionUpdate,
    }),
  );
});

it("toggles description field", () => {
  const { ui } = makeComp();

  /**
   * Given we are using new experience component
   */
  render(ui);

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

it("renders errors if we get field errors", async () => {
  const dataDefinitions: CreateDataDefinition[] = [
    {
      name: "nf",
      type: DataTypes.SINGLE_LINE_TEXT,
    },

    {
      name: "nf",
      type: DataTypes.DATETIME,
    },
  ];

  const { ui, mockCreateExperience } = makeComp();

  mockCreateExperience.mockResolvedValue({
    data: {
      createExperience: {
        errors: {
          title: "t",
          user: null,
          __typename: "CreateExperienceErrors",

          dataDefinitionsErrors: [
            {
              index: 1,
              errors: {
                name: "t",
                type: "t",
              },
            },
          ],
        },
      },
    } as CreateExperienceMutation,
  });

  /**
   * Given we are using new exp component
   */
  render(ui);

  /**
   * When we complete two fields, giving them same name
   */
  fillFields(dataDefinitions);

  /**
   * Then no error Uis should be visible
   */
  const $definition1Container = document.getElementById(
    "experience-definition-container-1",
  ) as HTMLDivElement;

  expect($definition1Container.classList).not.toContain("errors");

  const $definition1 = $definition1Container.querySelector(
    ".field",
  ) as HTMLDivElement;

  expect($definition1.classList).not.toContain("error");

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
  await wait(() => expect($definition1Container.classList).toContain("errors"));

  expect($definition1.classList).toContain("error");

  expect(document.getElementById("field-name-1-error")).not.toBeNull();

  expect(
    document.getElementById("experience-definition-title-error"),
  ).not.toBeNull();

  /**
   * And page should be scrolled up
   */
  expect(mockScrollIntoView).toHaveBeenCalled();

  /**
   * And error summary Ui should be visible on the page. And when we click on it
   */

  closeMessage(document.getElementById("experience-definition-errors-summary"));

  /**
   * Then error summary ui should no longer be visible on the page
   */
  expect(
    document.getElementById("experience-definition-errors-summary"),
  ).toBeNull();
});

it("renders error if all fields not completely filled on submission", async () => {
  const dataDefinitions: CreateDataDefinition[] = [
    {
      name: "nf",
      type: DataTypes.SINGLE_LINE_TEXT,
    },

    {
      name: "",
      type: DataTypes.DATETIME,
    },
  ];

  const { ui } = makeComp();

  render(ui);

  fillFields(dataDefinitions);

  const $definition1Container = document.getElementById(
    "experience-definition-container-1",
  ) as HTMLDivElement;

  expect($definition1Container.classList).not.toContain("errors");

  const $definition1 = $definition1Container.querySelector(
    ".field",
  ) as HTMLDivElement;

  expect($definition1.classList).not.toContain("error");

  fireEvent.click(document.getElementById(
    "experience-definition-submit-btn",
  ) as any);

  await wait(() => expect($definition1Container.classList).toContain("errors"));

  expect($definition1.classList).toContain("error");
});

it("saves experience when we are not connected", async () => {
  const dataDefinitions: CreateDataDefinition[] = [
    {
      name: "f0",
      type: DataTypes.SINGLE_LINE_TEXT,
    },

    {
      name: "f1",
      type: DataTypes.DATETIME,
    },
  ];

  /**
   * Given server is not connected
   */
  const { ui, mockNavigate, mockCreateUnsavedExperience } = makeComp(
    {},
    {
      isConnected: false,
    },
  );

  mockCreateUnsavedExperience.mockResolvedValue({
    data: {
      createOfflineExperience: {
        id: "1",
      },
    } as CreateOfflineExperienceMutationData,
  });

  /**
   * While we are using new experience component
   */
  render(ui);

  /**
   * When we complete and submit the form
   */
  fillFields(dataDefinitions);

  fireEvent.click(document.getElementById(
    "experience-definition-submit-btn",
  ) as any);

  await wait(() => {
    expect(mockNavigate).toBeCalledWith(makeExperienceRoute("1"));
  });

  /**
   * Then correct data should be uploaded to the server
   */
  await wait(() =>
    expect(mockCreateUnsavedExperience.mock.calls[0][0]).toMatchObject({
      variables: {
        createExperienceInput: {
          title,
          dataDefinitions,
          description: "",
        },
      } as CreateExperienceMutationVariables,
    }),
  );
});

it("renders error even if there are no fields error", async () => {
  const dataDefinitions: CreateDataDefinition[] = [
    {
      name: "12",
      type: DataTypes.SINGLE_LINE_TEXT,
    },
  ];

  const { ui } = makeComp();

  render(ui);

  // title must be of min length  2
  fillFields(dataDefinitions, { title: "a" });

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

it("renders network error", async () => {
  /**
   * Given server is not connected
   */
  const { ui, mockCreateExperience } = makeComp();

  mockCreateExperience.mockRejectedValue(
    new ApolloError({
      networkError: new Error("n"),
    }),
  );

  /**
   * While we are using new experience component
   */
  render(ui);

  /**
   * When we complete and submit the form
   */
  fillFields([
    {
      name: "f0",
      type: DataTypes.SINGLE_LINE_TEXT,
    },
  ]);

  expect(
    document.getElementById("experience-definition-errors-summary"),
  ).toBeNull();

  fireEvent.click(document.getElementById(
    "experience-definition-submit-btn",
  ) as any);

  /**
   * Then correct data should be uploaded to the server
   */
  const $error = await waitForElement(() =>
    document.getElementById("experience-definition-errors-summary"),
  );

  expect($error).not.toBeNull();
});

it("renders graphql error", async () => {
  /**
   * Given server is not connected
   */
  const { ui, mockCreateExperience } = makeComp();

  mockCreateExperience.mockRejectedValue(
    new ApolloError({
      graphQLErrors: [new GraphQLError("n")],
    }),
  );

  /**
   * While we are using new experience component
   */
  render(ui);

  /**
   * When we complete and submit the form
   */
  fillFields([
    {
      name: "f0",
      type: DataTypes.SINGLE_LINE_TEXT,
    },
  ]);

  expect(
    document.getElementById("experience-definition-errors-summary"),
  ).toBeNull();

  fireEvent.click(document.getElementById(
    "experience-definition-submit-btn",
  ) as any);

  /**
   * Then correct data should be uploaded to the server
   */
  const $error = await waitForElement(() =>
    document.getElementById("experience-definition-errors-summary"),
  );

  expect($error).not.toBeNull();
});

it("renders errors if exception is thrown during submit", async () => {
  /**
   * Given server is not connected
   */
  const { ui, mockCreateExperience } = makeComp();

  mockCreateExperience.mockRejectedValue(new Error("a"));

  /**
   * While we are using new experience component
   */
  render(ui);

  /**
   * When we complete and submit the form
   */
  fillFields([
    {
      name: "f0",
      type: DataTypes.SINGLE_LINE_TEXT,
    },
  ]);

  expect(
    document.getElementById("experience-definition-errors-summary"),
  ).toBeNull();

  fireEvent.click(document.getElementById(
    "experience-definition-submit-btn",
  ) as any);

  /**
   * Then correct data should be uploaded to the server
   */
  const $error = await waitForElement(() =>
    document.getElementById("experience-definition-errors-summary"),
  );

  expect($error).not.toBeNull();
});

it("renders errors if server's response is out of shape", async () => {
  /**
   * Given server is not connected
   */
  const { ui, mockCreateExperience } = makeComp();

  mockCreateExperience.mockResolvedValue({});

  /**
   * While we are using new experience component
   */
  render(ui);

  /**
   * When we complete and submit the form
   */
  fillFields([
    {
      name: "f0",
      type: DataTypes.SINGLE_LINE_TEXT,
    },
  ]);

  expect(
    document.getElementById("experience-definition-errors-summary"),
  ).toBeNull();

  fireEvent.click(document.getElementById(
    "experience-definition-submit-btn",
  ) as any);

  /**
   * Then correct data should be uploaded to the server
   */
  const $error = await waitForElement(() =>
    document.getElementById("experience-definition-errors-summary"),
  );

  expect($error).not.toBeNull();
});

////////////////////////// HELPER FUNCTIONS ///////////////////////////

const ExperienceDefinitionP = ExperienceDefinition as ComponentType<
  Partial<Props>
>;

function makeComp(
  props: Partial<Props> = {},
  { isConnected = true }: { isConnected?: boolean } = {},
) {
  mockIsConnected.mockReturnValue(isConnected);

  const mockCreateExperience = jest.fn();
  const mockCreateUnsavedExperience = jest.fn();

  mockUseCreateExperience.mockReturnValue([mockCreateExperience]);
  mockUseCreateUnsavedExperience.mockReturnValue([mockCreateUnsavedExperience]);

  const { Ui, ...rest } = renderWithRouter(ExperienceDefinitionP);

  const client = {
    addResolvers: jest.fn(),
  };

  const ebnisAppContext = {
    client,
  } as any;

  return {
    ui: (
      <EbnisAppProvider value={ebnisAppContext}>
        <Ui {...props} />
      </EbnisAppProvider>
    ),
    mockCreateExperience,
    mockCreateUnsavedExperience,
    ...rest,
  };
}

function fillFields(
  dataDefinitions: CreateDataDefinition[],
  fieldData: { title?: string } = {},
) {
  fillField(
    document.getElementById("experience-definition-title-input") as any,
    fieldData.title || title,
  );

  const len = dataDefinitions.length;

  dataDefinitions.map(({ type, name }, index) => {
    fillFieldDefinition(name, type, index);

    if (index + 1 < len) {
      fireEvent.click(document.getElementById(
        `add-definition-btn-${index}`,
      ) as any);
    }
  });
}

function fillFieldDefinition(name: string, type: string, index: number) {
  fillField(document.getElementById(`field-name-${index}`) as any, name);

  fireEvent.click((document.getElementById(
    `experience-data-type-${index}`,
  ) as HTMLElement).getElementsByClassName(`js-${type}`)[0] as any);
}

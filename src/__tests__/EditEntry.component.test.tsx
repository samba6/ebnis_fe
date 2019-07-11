/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { ComponentType } from "react";
import "jest-dom/extend-expect";
import "react-testing-library/cleanup-after-each";
import { render, act, waitForElement } from "react-testing-library";
import { EditEntry } from "../components/EditEntry/component";
import { Props, EditEntryStateTag } from "../components/EditEntry/utils";
import {
  EntryFragment,
  EntryFragment_fields,
} from "../graphql/apollo-types/EntryFragment";
import { FieldType } from "../graphql/apollo-types/globalTypes";
import { ExperienceFragment_fieldDefs } from "../graphql/apollo-types/ExperienceFragment";

jest.mock("../components/scroll-into-view");

import { scrollIntoView } from "../components/scroll-into-view";
import { fillField, closeMessage } from "./test_utils";
import {
  UpdateEntryMutation,
  UpdateEntryMutation_updateEntry_fieldsErrors,
} from "../graphql/apollo-types/UpdateEntryMutation";

const mockScrollIntoView = scrollIntoView as jest.Mock;

it("renders date field and submits successfully", done => {
  const { ui, mockOnEdit, mockDispatch } = makeComp({
    props: {
      entry: {
        id: "1",
        fields: [
          {
            defId: "1",
            data: `{"date":"2015-01-06"}`,
          },
        ] as EntryFragment_fields[],
      } as EntryFragment,

      fieldDefinitions: [
        {
          id: "1",
          type: FieldType.DATE,
          name: "aa",
        },
      ] as ExperienceFragment_fieldDefs[],
    },
  });

  mockOnEdit.mockResolvedValue({
    data: {
      updateEntry: {
        entry: {},
      },
    },
  });

  const {} = render(ui);

  const $button = document.getElementById(
    "edit-entry-submit",
  ) as HTMLButtonElement;

  expect($button).toBeDisabled();

  // the data year is 2015, let's change to previous year
  (document.getElementById("fields[0].data.year-2014") as any).click();

  expect($button).not.toBeDisabled();

  act(() => {
    $button.click();
  });

  setTimeout(() => {
    expect((mockOnEdit.mock.calls[0][0] as any).variables.input).toEqual({
      id: "1",
      fields: [
        {
          data: `{"date":"2014-01-06"}`,
          defId: "1",
        },
      ],
    });

    expect(mockDispatch.mock.calls[0][0][0]).toBe(EditEntryStateTag.completed);

    closeMessage(document.getElementById("edit-entry-modal"));
    expect(mockDispatch.mock.calls[1][0][0]).toBe(EditEntryStateTag.aborted);

    done();
  });
});

it("renders datetime field and apollo error", async () => {
  const { ui, mockOnEdit, mockDispatch } = makeComp({
    props: {
      entry: {
        id: "1",
        fields: [
          {
            defId: "1",
            data: `{"datetime":"2015-07-11T16:03:00.000Z"}`,
          },
        ] as EntryFragment_fields[],
      } as EntryFragment,

      fieldDefinitions: [
        {
          id: "1",
          type: FieldType.DATETIME,
          name: "aa",
        },
      ] as ExperienceFragment_fieldDefs[],
    },
  });

  mockOnEdit.mockRejectedValue(new Error("error"));

  const {} = render(ui);

  // the data year is 2015, let's change to previous year
  (document.getElementById("fields[0].data.date.year-2014") as any).click();

  act(() => {
    (document.getElementById("edit-entry-submit") as HTMLButtonElement).click();
  });

  const $error = await waitForElement(() =>
    document.getElementById("edit-entry-server-error"),
  );

  expect($error).not.toBeNull();

  expect((mockOnEdit.mock.calls[0][0] as any).variables.input).toEqual({
    id: "1",
    fields: [
      {
        data: `{"datetime":"2014-07-11T16:03:00.000Z"}`,
        defId: "1",
      },
    ],
  });

  expect(mockDispatch).not.toHaveBeenCalled();

  expect(mockScrollIntoView).toHaveBeenCalled();

  closeMessage($error);

  expect(document.getElementById("edit-entry-server-error")).toBeNull();
});

it("renders single line text field and other unknown errors", async () => {
  const { ui, mockOnEdit } = makeComp({
    props: {
      entry: {
        id: "1",
        fields: [
          {
            defId: "1",
            data: `{"single_line_text":"1"}`,
          },
        ] as EntryFragment_fields[],
      } as EntryFragment,

      fieldDefinitions: [
        {
          id: "1",
          type: FieldType.SINGLE_LINE_TEXT,
          name: "aa",
        },
      ] as ExperienceFragment_fieldDefs[],
    },
  });

  mockOnEdit.mockResolvedValue({});

  const {} = render(ui);

  fillField(document.getElementById("aa") as any, "2");

  act(() => {
    (document.getElementById("edit-entry-submit") as HTMLButtonElement).click();
  });

  const $error = await waitForElement(() =>
    document.getElementById("edit-entry-server-error"),
  );

  expect($error).not.toBeNull();

  expect((mockOnEdit.mock.calls[0][0] as any).variables.input).toEqual({
    id: "1",
    fields: [
      {
        data: `{"single_line_text":"2"}`,
        defId: "1",
      },
    ],
  });
});

it("renders multiline line text field and field errors", async () => {
  const { ui, mockOnEdit } = makeComp({
    props: {
      entry: {
        id: "1",
        fields: [
          {
            defId: "1",
            data: `{"multi_line_text":"1"}`,
          },
        ] as EntryFragment_fields[],
      } as EntryFragment,

      fieldDefinitions: [
        {
          id: "1",
          type: FieldType.MULTI_LINE_TEXT,
          name: "aa",
        },
      ] as ExperienceFragment_fieldDefs[],
    },
  });

  mockOnEdit.mockResolvedValue({
    data: {
      updateEntry: {
        fieldsErrors: [
          {
            defId: "1",
            error: {
              data: "invalid",
            },
          } as UpdateEntryMutation_updateEntry_fieldsErrors,
        ] as UpdateEntryMutation_updateEntry_fieldsErrors[],
      },
    } as UpdateEntryMutation,
  });

  const {} = render(ui);

  fillField(document.getElementById("aa") as any, "2");

  act(() => {
    (document.getElementById("edit-entry-submit") as HTMLButtonElement).click();
  });

  const $error = await waitForElement(() =>
    document.getElementById("aa-error"),
  );

  expect($error).not.toBeNull();

  expect((mockOnEdit.mock.calls[0][0] as any).variables.input).toEqual({
    id: "1",
    fields: [
      {
        data: `{"multi_line_text":"2"}`,
        defId: "1",
      },
    ],
  });
});

it("renders integer field and field errors", async () => {
  const { ui, mockOnEdit } = makeComp({
    props: {
      entry: {
        id: "1",
        fields: [
          {
            defId: "1",
            data: `{"integer":"1"}`,
          },
        ] as EntryFragment_fields[],
      } as EntryFragment,

      fieldDefinitions: [
        {
          id: "1",
          type: FieldType.INTEGER,
          name: "aa",
        },
      ] as ExperienceFragment_fieldDefs[],
    },
  });

  mockOnEdit.mockResolvedValue({
    data: {
      updateEntry: {
        fieldsErrors: [
          {
            defId: "1",
            error: {
              defId: "invalid",
            },
          } as UpdateEntryMutation_updateEntry_fieldsErrors,
        ] as UpdateEntryMutation_updateEntry_fieldsErrors[],
      },
    } as UpdateEntryMutation,
  });

  const {} = render(ui);

  fillField(document.getElementById("aa") as any, "2");

  act(() => {
    (document.getElementById("edit-entry-submit") as HTMLButtonElement).click();
  });

  const $error = await waitForElement(() =>
    document.getElementById("aa-error"),
  );

  expect($error).not.toBeNull();

  expect((mockOnEdit.mock.calls[0][0] as any).variables.input).toEqual({
    id: "1",
    fields: [
      {
        data: `{"integer":"2"}`,
        defId: "1",
      },
    ],
  });

  expect(mockScrollIntoView).toHaveBeenCalled();
});

it("renders decimal field", async () => {
  const { ui, mockOnEdit } = makeComp({
    props: {
      entry: {
        id: "1",
        fields: [
          {
            defId: "1",
            data: `{"decimal":"1"}`,
          },
        ] as EntryFragment_fields[],
      } as EntryFragment,

      fieldDefinitions: [
        {
          id: "1",
          type: FieldType.DECIMAL,
          name: "aa",
        },
      ] as ExperienceFragment_fieldDefs[],
    },
  });

  mockOnEdit.mockResolvedValue({});

  const {} = render(ui);

  fillField(document.getElementById("aa") as any, "2");

  act(() => {
    (document.getElementById("edit-entry-submit") as HTMLButtonElement).click();
  });

  const $error = await waitForElement(() =>
    document.getElementById("edit-entry-server-error"),
  );

  expect($error).not.toBeNull();

  expect((mockOnEdit.mock.calls[0][0] as any).variables.input).toEqual({
    id: "1",
    fields: [
      {
        data: `{"decimal":"2"}`,
        defId: "1",
      },
    ],
  });
});

it("throws error for invalid data type", () => {
  const { ui } = makeComp({
    props: {
      entry: {
        id: "1",
        fields: [
          {
            defId: "1",
            data: `{"unknown":"1"}`,
          },
        ] as EntryFragment_fields[],
      } as EntryFragment,

      fieldDefinitions: [
        {
          id: "1",
          type: "unknown" as FieldType.DECIMAL,
          name: "x",
        },
      ] as ExperienceFragment_fieldDefs[],
    },
  });

  expect.assertions(1);

  render(ui);

  expect(document.getElementById("unknown-data-type")).not.toBeNull();
});

////////////////////////// HELPER FUNCTIONS ///////////////////////////////////
const EditEntryP = EditEntry as ComponentType<Partial<Props>>;

function makeComp({ props = {} }: { props?: Partial<Props> } = {}) {
  mockScrollIntoView.mockReset();

  const mockOnEdit = jest.fn();
  const mockDispatch = jest.fn();

  return {
    ui: <EditEntryP onEdit={mockOnEdit} dispatch={mockDispatch} {...props} />,
    mockOnEdit,
    mockDispatch,
  };
}

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
import { ApolloError } from "apollo-client";
import { GraphQLError } from "graphql";

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
    done();
  });
});

it("renders datetime field and and graphql error", async () => {
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

  mockOnEdit.mockRejectedValue(
    new ApolloError({
      graphQLErrors: [new GraphQLError("error occurred")],
    }),
  );

  const {} = render(ui);

  const $button = document.getElementById(
    "edit-entry-submit",
  ) as HTMLButtonElement;

  expect($button).toBeDisabled();

  // the data year is 2015, let's change to previous year
  (document.getElementById("fields[0].data.date.year-2014") as any).click();

  expect($button).not.toBeDisabled();

  act(() => {
    $button.click();
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
});

////////////////////////// HELPER FUNCTIONS ///////////////////////////////////
const EditEntryP = EditEntry as ComponentType<Partial<Props>>;

function makeComp({ props = {} }: { props?: Partial<Props> } = {}) {
  const mockOnEdit = jest.fn();
  const mockDispatch = jest.fn();

  return {
    ui: <EditEntryP onEdit={mockOnEdit} dispatch={mockDispatch} {...props} />,
    mockOnEdit,
    mockDispatch,
  };
}

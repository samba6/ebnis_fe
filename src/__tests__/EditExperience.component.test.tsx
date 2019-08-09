/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { ComponentType } from "react";
import "jest-dom/extend-expect";
import "react-testing-library/cleanup-after-each";
import { render, act, wait, waitForElement } from "react-testing-library";
import { EditExperience } from "../components/EditExperience/component";
import {
  Props,
  EditExperienceActionType,
} from "../components/EditExperience/utils";
import { ExperienceFragment } from "../graphql/apollo-types/ExperienceFragment";
import { fillField, closeMessage } from "./test_utils";
import { ApolloError } from "apollo-client";
import { UpdateExperienceMutation } from '../graphql/apollo-types/UpdateExperienceMutation';

const experience = {
  id: "1",
  title: "aa",
  dataDefinitions: [
    {
      id: "f1",
      name: "aa",
    },
  ],
} as ExperienceFragment;

it("submits form and closes modal when everything goes well", async () => {
  const { ui, mockOnEdit, mockDispatch } = makeComp({
    props: {
      experience,
    },
  });

  mockOnEdit.mockResolvedValue({
    data: {
      updateExperience: {
        experience: {},
      },
    },
  });

  const { } = render(ui);

  const $description = document.getElementById(
    "edit-experience-form-description",
  ) as HTMLInputElement;

  const $btn = document.getElementById(
    "edit-experience-submit",
  ) as HTMLButtonElement;

  expect($btn).toBeDisabled();

  fillField($description, "cc");

  expect($btn).not.toBeDisabled();

  act(() => {
    $btn.click();
  });

  await wait(() => {
    expect(mockOnEdit).toHaveBeenCalled();
  });

  expect(mockDispatch).toHaveBeenCalledWith([
    EditExperienceActionType.completed,
  ]);
});

it("renders apollo error and closes form when close button clicked", async () => {
  const { ui, mockOnEdit, mockDispatch } = makeComp({
    props: {
      experience,
    },
  });

  mockOnEdit.mockRejectedValue(
    new ApolloError({
      errorMessage: "Some error occurred",
    }),
  );

  const { } = render(ui);

  fillField(
    document.getElementById("edit-experience-form-description") as any,
    "cc",
  );

  act(() => {
    (document.getElementById(
      "edit-experience-submit",
    ) as HTMLButtonElement).click();
  });

  const $error = await waitForElement(() =>
    document.getElementById("edit-experience-server-error"),
  );

  expect($error).not.toBeNull();

  expect(mockDispatch).not.toHaveBeenCalled();

  closeMessage($error);

  expect(document.getElementById("edit-experience-server-error")).toBeNull();

  closeMessage(document.getElementById("edit-experience-modal") as any);

  expect(mockDispatch.mock.calls[0][0][0]).toBe(
    EditExperienceActionType.aborted,
  );
});

it("renders experience error", async () => {
  const { ui, mockOnEdit, mockDispatch } = makeComp({
    props: {
      experience,
    },
  });

  mockOnEdit.mockResolvedValue({
    data: {
      updateExperience: {
        errors: {
          title: "error",
        },
      },
    } as UpdateExperienceMutation,
  });

  const { } = render(ui);

  fillField(
    document.getElementById(
      "edit-experience-form-description",
    ) as HTMLInputElement,
    "cc",
  );

  act(() => {
    (document.getElementById(
      "edit-experience-submit",
    ) as HTMLButtonElement).click();
  });

  const $error = await waitForElement(() => {
    return document.getElementById("edit-experience-ctrl-error-title");
  });

  expect($error).not.toBeNull();

  expect(mockDispatch).not.toHaveBeenCalled();
});



it("renders other errors", async () => {
  const { ui, mockOnEdit, mockDispatch } = makeComp({
    props: {
      experience,
    },
  });

  mockOnEdit.mockResolvedValue({});

  const { } = render(ui);

  fillField(
    document.getElementById(
      "edit-experience-form-description",
    ) as HTMLInputElement,
    "cc",
  );

  act(() => {
    (document.getElementById(
      "edit-experience-submit",
    ) as HTMLButtonElement).click();
  });

  const $error = await waitForElement(() =>
    document.getElementById("edit-experience-server-error"),
  );

  expect($error).not.toBeNull();

  expect(mockDispatch).not.toHaveBeenCalled();
});

////////////////////////// HELPER FUNCTIONS ///////////////////////////////////

const EditExperienceP = EditExperience as ComponentType<Partial<Props>>;

function makeComp({
  props = {
    experience: {} as any,
  },
}: { props?: Partial<Props> } = {}) {
  const mockOnEdit = jest.fn();
  const mockDispatch = jest.fn();

  return {
    ui: (
      <EditExperienceP onEdit={mockOnEdit} dispatch={mockDispatch} {...props} />
    ),
    mockOnEdit,
    mockDispatch,
  };
}

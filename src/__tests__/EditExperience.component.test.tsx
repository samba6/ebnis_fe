/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { ComponentType } from "react";
import { render, cleanup, wait, waitForElement } from "@testing-library/react";
import { EditExperience } from "../components/EditExperience/edit-experience.component";
import {
  Props,
  GENERIC_SERVER_ERROR,
  FORM_CONTAINS_ERRORS_MESSAGE,
} from "../components/EditExperience/edit-experience.utils";
import { ExperienceFragment } from "../graphql/apollo-types/ExperienceFragment";
import { fillField } from "./test_utils";
import {
  titleInputId,
  descriptionInputId,
  submitBtnId,
  resetFormFieldsBtnId,
  errorsNotificationId,
  titleInputErrorId,
  warningNotificationId,
  closeModalBtnId,
  closeSubmitNotificationBtnSelector,
  successNotificationId,
  definitionErrorSelector,
} from "../components/EditExperience/edit-experience.dom";
import { UpdateExperiencesOnlineMutationResult } from "../graphql/update-experience.mutation";
import ApolloClient, { ApolloError } from "apollo-client";
import { GraphQLError } from "graphql";
import { scrollIntoView } from "../components/scroll-into-view";
import { UpdateExperienceOflineMutationResult } from "../components/EditExperience/edit-experience.resolvers";

jest.mock("../apollo-cache/update-experiences");
jest.mock("../components/EditExperience/edit-experience.resolvers");

jest.mock("../components/scroll-into-view");
const mockScrollIntoView = scrollIntoView as jest.Mock;

const mockParentDispatch = jest.fn();
const mockUpdateExperiencesOnline = jest.fn();
const mockUpdateExperienceOffline = jest.fn();
const client = { addResolvers: (() => undefined) as any } as ApolloClient<{}>;

beforeEach(() => {
  jest.resetAllMocks();
});

afterEach(() => {
  cleanup();
});

it("online", async () => {
  const experienceId = "ex";

  const { ui } = makeComp({
    props: {
      experience: {
        id: experienceId,
        title: "t1",
        description: "d1",
        dataDefinitions: [
          {
            id: "f1",
            name: "aa",
          },
        ],
      } as ExperienceFragment,
      hasConnection: true,
    },
  });

  /**
   * Submissions:
   * 1. no edits
   * 2. invalid update results
   * 3. no edits - ownFields
   * 4. ownFields form invalid
   * 5. JS exception
   * 6. networkError
   * 7. graphQLErrors
   * 8. UpdateExperiencesAllFail
   * 9. UpdateExperienceFullErrors
   * 10. UpdateExperienceSomeSuccess: all nulls
   * 11. UpdateExperienceOwnFieldsErrors
   * 12. ExperienceOwnFieldsSuccess
   * 13. definition form invalid
   * 14. no edits - definitions
   * 15. DefinitionError
   * 16. DefinitionSuccess
   */

  mockUpdateExperiencesOnline
    .mockResolvedValueOnce({}) // 2
    .mockRejectedValueOnce(new Error("a")) // 5
    .mockRejectedValueOnce(
      new ApolloError({
        networkError: new Error("a"),
      }),
    ) // 6
    .mockRejectedValueOnce(
      new ApolloError({
        graphQLErrors: [new GraphQLError("a")],
      }),
    ) // 7
    .mockResolvedValueOnce({
      data: {
        updateExperiences: {
          __typename: "UpdateExperiencesAllFail",
          error: "UpdateExperiencesAllFail",
        },
      },
    } as UpdateExperiencesOnlineMutationResult) // 8
    .mockResolvedValueOnce({
      data: {
        updateExperiences: {
          __typename: "UpdateExperiencesSomeSuccess",
          experiences: [
            {
              __typename: "UpdateExperienceFullErrors",
              errors: {
                error: "UpdateExperienceFullErrors",
              },
            },
          ],
        },
      },
    } as UpdateExperiencesOnlineMutationResult) // 9
    .mockResolvedValueOnce({
      data: {
        updateExperiences: {
          __typename: "UpdateExperiencesSomeSuccess",
          experiences: [
            {
              __typename: "UpdateExperienceSomeSuccess",
              experience: {},
            },
          ],
        },
      },
    } as UpdateExperiencesOnlineMutationResult) // 10
    .mockResolvedValueOnce({
      data: {
        updateExperiences: {
          __typename: "UpdateExperiencesSomeSuccess",
          experiences: [
            {
              __typename: "UpdateExperienceSomeSuccess",
              experience: {
                ownFields: {
                  __typename: "UpdateExperienceOwnFieldsErrors",
                  errors: {
                    title: "t",
                  },
                },
              },
            },
          ],
        },
      },
    } as UpdateExperiencesOnlineMutationResult) // 11
    .mockResolvedValueOnce({
      data: {
        updateExperiences: {
          __typename: "UpdateExperiencesSomeSuccess",
          experiences: [
            {
              __typename: "UpdateExperienceSomeSuccess",
              experience: {
                ownFields: {
                  __typename: "ExperienceOwnFieldsSuccess",
                  data: {
                    title: "t3",
                    description: "d3",
                  },
                },
              },
            },
          ],
        },
      },
    } as UpdateExperiencesOnlineMutationResult) // 12
    .mockResolvedValueOnce({
      data: {
        updateExperiences: {
          __typename: "UpdateExperiencesSomeSuccess",
          experiences: [
            {
              __typename: "UpdateExperienceSomeSuccess",
              experience: {
                updatedDefinitions: [
                  {
                    __typename: "DefinitionErrors",
                    errors: {
                      id: "f1",
                      name: "a",
                      error: null,
                    },
                  },
                ],
              },
            },
          ],
        },
      },
    } as UpdateExperiencesOnlineMutationResult) // 15
    .mockResolvedValueOnce({
      data: {
        updateExperiences: {
          __typename: "UpdateExperiencesSomeSuccess",
          experiences: [
            {
              __typename: "UpdateExperienceSomeSuccess",
              experience: {
                updatedDefinitions: [
                  {
                    __typename: "DefinitionSuccess",
                    definition: {
                      id: "f1",
                      name: "a2",
                    },
                  },
                ],
              },
            },
          ],
        },
      },
    } as UpdateExperiencesOnlineMutationResult); // 16

  render(ui);

  /**
   * Then description input should contain default value
   */
  const descriptionInput = document.getElementById(
    descriptionInputId,
  ) as HTMLInputElement;

  expect(descriptionInput.value).toBe("d1");

  /**
   * And title input should contain default value
   */
  const titleInput = document.getElementById(titleInputId) as HTMLInputElement;
  expect(titleInput.value).toBe("t1");

  /**
   * And no warning UI should be visible
   */
  expect(document.getElementById(warningNotificationId)).toBeNull();

  /**
   * When form is submitted
   */
  const submitBtn = document.getElementById(submitBtnId) as HTMLButtonElement;
  submitBtn.click(); // 1

  /**
   * Then warning UI should be visible
   */
  expect(document.getElementById(warningNotificationId)).not.toBeNull();

  /**
   * When title is updated
   */
  fillField(titleInput, "t2");

  /**
   * Then error UI should not be visible
   */
  expect(document.getElementById(errorsNotificationId)).toBeNull();

  /**
   * When form is re-submitted (2)
   */
  submitBtn.click(); // 2

  /**
   * Then error UI should be visible
   */
  await wait(() => true);
  expect(
    (document.getElementById(errorsNotificationId) as HTMLElement).textContent,
  ).toBe(GENERIC_SERVER_ERROR);

  /**
   *  And warning UI should not be visible
   */
  expect(document.getElementById(warningNotificationId)).toBeNull();

  /**
   * When title is reverted back to default
   */
  fillField(titleInput, "t1");

  /**
   * And form is submitted again (3)
   */
  submitBtn.click(); // 3

  /**
   * Then warning UI should be visible
   */
  expect(document.getElementById(warningNotificationId)).not.toBeNull();

  /**
   * And error UI should not be visible
   */
  expect(document.getElementById(errorsNotificationId)).toBeNull();

  /**
   * When title is completed with incorrect data
   */
  fillField(titleInput, "t");

  /**
   * Then title error should not be visible
   */
  expect(document.getElementById(titleInputErrorId)).toBeNull();
  expect((titleInput.closest(".field") as HTMLElement).classList).not.toContain(
    "error",
  );

  /**
   * When form is submitted again (4)
   */
  submitBtn.click(); // 4

  /**
   * Then error UI should be visible
   */
  expect(document.getElementById(errorsNotificationId)).not.toBeNull();

  /**
   * And title error should become visible
   */
  expect(document.getElementById(titleInputErrorId)).not.toBeNull();
  expect((titleInput.closest(".field") as HTMLElement).classList).toContain(
    "error",
  );

  /**
   * And error notification message should change
   */
  expect(
    (document.getElementById(errorsNotificationId) as HTMLElement).textContent,
  ).toBe(FORM_CONTAINS_ERRORS_MESSAGE);

  /**
   * When reset button is clicked
   */
  const resetBtn = document.getElementById(resetFormFieldsBtnId) as HTMLElement;
  resetBtn.click();

  /**
   * Then error UIs should not be visible
   */
  expect(document.getElementById(errorsNotificationId)).toBeNull();
  expect(document.getElementById(titleInputErrorId)).toBeNull();
  expect((titleInput.closest(".field") as HTMLElement).classList).not.toContain(
    "error",
  );

  /**
   * Title input should revert to default value
   */
  expect(titleInput.value).toBe("t1");

  /**
   * When description input is updated
   */
  fillField(descriptionInput, "d2");

  /**
   * And form is re-submitted (5)
   */
  submitBtn.click(); // 5

  /**
   * Then error notification should be visible
   */
  let errorsNotification = await waitForElement(() => {
    return document.getElementById(errorsNotificationId) as HTMLElement;
  });

  /**
   * When error UI is closed
   */
  (errorsNotification.querySelector(
    `.${closeSubmitNotificationBtnSelector}`,
  ) as HTMLElement).click();

  /**
   * Then error UI should no longer be visible
   */
  expect(document.getElementById(errorsNotificationId)).toBeNull();

  /**
   * When form is re-submitted (6)
   */
  submitBtn.click(); // 6

  /**
   * Then error UI should be visible again
   */
  errorsNotification = await waitForElement(() => {
    return document.getElementById(errorsNotificationId) as HTMLElement;
  });

  /**
   * When error UI is closed
   */
  (errorsNotification.querySelector(
    `.${closeSubmitNotificationBtnSelector}`,
  ) as HTMLElement).click();

  /**
   * Then error UI should no longer be visible
   */
  expect(document.getElementById(errorsNotificationId)).toBeNull();

  /**
   * When form is re-submitted (7)
   */
  submitBtn.click(); // 7

  /**
   * Then error UI should be visible again
   */
  errorsNotification = await waitForElement(() => {
    return document.getElementById(errorsNotificationId) as HTMLElement;
  });

  /**
   * When error UI is closed
   */
  (errorsNotification.querySelector(
    `.${closeSubmitNotificationBtnSelector}`,
  ) as HTMLElement).click();

  /**
   * Then error UI should no longer be visible
   */
  expect(document.getElementById(errorsNotificationId)).toBeNull();

  /**
   * When form is re-submitted (8)
   */
  submitBtn.click(); // 8

  /**
   * Then error UI should be visible again
   */
  errorsNotification = await waitForElement(() => {
    return document.getElementById(errorsNotificationId) as HTMLElement;
  });

  /**
   * When error UI is closed
   */
  (errorsNotification.querySelector(
    `.${closeSubmitNotificationBtnSelector}`,
  ) as HTMLElement).click();

  /**
   * Then error UI should no longer be visible
   */
  expect(document.getElementById(errorsNotificationId)).toBeNull();

  /**
   * When form is re-submitted
   */
  submitBtn.click(); // 9

  /**
   * Then error UI should be visible again
   */
  errorsNotification = await waitForElement(() => {
    return document.getElementById(errorsNotificationId) as HTMLElement;
  });

  /**
   * When error UI is closed
   */
  (errorsNotification.querySelector(
    `.${closeSubmitNotificationBtnSelector}`,
  ) as HTMLElement).click();

  /**
   * Then error UI should no longer be visible
   */
  expect(document.getElementById(errorsNotificationId)).toBeNull();

  /**
   * When form is re-submitted
   */
  submitBtn.click(); // 10

  /**
   * Then error UI should be visible again
   */
  errorsNotification = await waitForElement(() => {
    return document.getElementById(errorsNotificationId) as HTMLElement;
  });

  /**
   * When error UI is closed
   */
  (errorsNotification.querySelector(
    `.${closeSubmitNotificationBtnSelector}`,
  ) as HTMLElement).click();

  /**
   * Then error UIs should no longer be visible
   */
  expect(document.getElementById(errorsNotificationId)).toBeNull();
  expect(document.getElementById(titleInputErrorId)).toBeNull();

  /**
   * When title field is updated
   */
  fillField(titleInput, "t2");

  /**
   * And form is re-submitted
   */
  submitBtn.click(); // 11

  /**
   * Then error UIs should be visible again
   */
  await waitForElement(() => {
    return document.getElementById(errorsNotificationId) as HTMLElement;
  });
  expect(document.getElementById(titleInputErrorId)).not.toBeNull();

  /**
   * And success UI should not be visible
   */
  expect(document.getElementById(successNotificationId)).toBeNull();

  /**
   * When form is re-submitted
   */
  submitBtn.click(); // 12

  /**
   * Then success UI should be visible
   */
  await waitForElement(() => {
    return document.getElementById(successNotificationId);
  });

  /**
   * And error UIs should no longer be visible
   */
  expect(document.getElementById(errorsNotificationId)).toBeNull();
  expect(document.getElementById(titleInputErrorId)).toBeNull();

  /**
   * And correct data should have been sent to server
   */
  const mockUpdateDataOnlineCalls = mockUpdateExperiencesOnline.mock.calls;
  const [mockUpdateDataOnlineArgs] = mockUpdateDataOnlineCalls[
    mockUpdateDataOnlineCalls.length - 1
  ][0].variables.input;

  expect(mockUpdateDataOnlineArgs).toEqual({
    experienceId,
    ownFields: {
      description: "d2",
      title: "t2",
    },
  });

  /**
   * And form input values should be updated values from server
   */
  expect(titleInput.value).toBe("t3");
  expect(descriptionInput.value).toBe("d3");

  ////////////////////////// close component ////////////////////////////

  /**
   * And component's parent should not be notified
   */
  expect(mockParentDispatch).not.toHaveBeenCalled();

  /**
   * When component close button is clicked
   */
  (document.getElementById(closeModalBtnId) as HTMLElement).click();

  /**
   * Then component's parent should be notified
   */
  expect(mockParentDispatch).toHaveBeenCalled();

  /**
   * When definition name is updated to invalid value
   */
  const definitionInput = document.getElementById("f1") as HTMLInputElement;
  const definitionInputField = definitionInput.closest(".field") as HTMLElement;

  fillField(definitionInput, "a");
  mockScrollIntoView.mockReset();

  /**
   * Then error UIs should not be visible
   */
  expect(document.getElementById(errorsNotificationId)).toBeNull();
  expect(definitionInputField.classList).not.toContain("error");
  expect(
    definitionInputField.getElementsByClassName(definitionErrorSelector)[0],
  ).toBeUndefined();

  /**
   * And page should not be scrolled
   */
  expect(mockScrollIntoView).not.toHaveBeenCalled();

  /**
   * When form is submitted
   */
  submitBtn.click(); // 13

  await wait(() => true);

  /**
   * Then error UIs should be visible
   */
  expect(document.getElementById(errorsNotificationId)).not.toBeNull();
  expect(definitionInputField.classList).toContain("error");
  expect(
    definitionInputField.getElementsByClassName(definitionErrorSelector)[0],
  ).toBeDefined();

  /**
   * And page should be scrolled
   */
  expect(mockScrollIntoView).toHaveBeenCalled();

  /**
   * When reset button is clicked
   */
  resetBtn.click();

  /**
   * Then error UIs should no longer be visible
   */
  expect(document.getElementById(errorsNotificationId)).toBeNull();
  expect(definitionInputField.classList).not.toContain("error");
  expect(
    definitionInputField.getElementsByClassName(definitionErrorSelector)[0],
  ).toBeUndefined();

  /**
   * And definition name should revert to default
   */
  expect(definitionInput.value).toBe("aa");

  mockScrollIntoView.mockReset();

  /**
   * And page should not be scrolled
   */
  expect(mockScrollIntoView).not.toHaveBeenCalled();

  /**
   * And no warning UI should be visible
   */
  expect(document.getElementById(warningNotificationId)).toBeNull();

  /**
   * When form is submitted
   */
  submitBtn.click(); // 14
  await wait(() => true);

  /**
   *  Then warning UI should be visible
   */
  expect(document.getElementById(warningNotificationId)).not.toBeNull();

  /**
   * And page should be scrolled
   */
  expect(mockScrollIntoView).toHaveBeenCalled();

  /**
   * When definition name is updated
   */
  fillField(definitionInput, "a1");

  /**
   * Then error UIs should no longer be visible
   */
  expect(document.getElementById(errorsNotificationId)).toBeNull();
  expect(definitionInputField.classList).not.toContain("error");
  expect(
    definitionInputField.getElementsByClassName(definitionErrorSelector)[0],
  ).toBeUndefined();

  /**
   * And page should not be scrolled
   */
  mockScrollIntoView.mockReset();
  expect(mockScrollIntoView).not.toHaveBeenCalled();

  /**
   * When form is submitted
   */
  submitBtn.click(); // 15

  /**
   * Then error UIs should be visible
   */
  await waitForElement(() => {
    return document.getElementById(errorsNotificationId);
  });
  expect(definitionInputField.classList).toContain("error");
  expect(
    definitionInputField.getElementsByClassName(definitionErrorSelector)[0],
  ).toBeDefined();

  /**
   * And success UI should not be visible
   */
  expect(document.getElementById(successNotificationId)).toBeNull();

  /**
   * When form is submitted
   */
  submitBtn.click(); // 16

  /**
   * Then success UI should be visible
   */
  await waitForElement(() => document.getElementById(successNotificationId));

  /**
   * And error UIs should no longer be visible
   */
  expect(document.getElementById(errorsNotificationId)).toBeNull();
  expect(definitionInputField.classList).not.toContain("error");
  expect(
    definitionInputField.getElementsByClassName(definitionErrorSelector)[0],
  ).toBeUndefined();

  /**
   * And definition should be updated to value from server
   */
  expect(definitionInput.value).toBe("a2");

  /**
   * And page should be scrolled
   */
  expect(mockScrollIntoView).toHaveBeenCalled();
});

it("offline", async () => {
  const { ui } = makeComp({
    props: {
      experience: {
        id: "ex",
        title: "t1",
        description: "d1",
        dataDefinitions: [
          {
            id: "f1",
            name: "f1",
          },
        ],
      } as ExperienceFragment,
    },
  });

  /**
   * Submissions
   * 1. Invalid results
   * 2. server error
   * 3. server success - title updated
   * 4. server success - description updated
   * 5. server success - definition updated
   * 6. form warning - definition updated with empty spaces
   */

  mockUpdateExperienceOffline
    .mockResolvedValueOnce({})
    .mockResolvedValueOnce({
      data: {
        updateExperienceOffline: {
          __typename: "UpdateExperienceOfflineError",
          error: {
            error: "a",
          },
        },
      },
    } as UpdateExperienceOflineMutationResult)
    .mockResolvedValueOnce({
      data: {
        updateExperienceOffline: {
          __typename: "UpdateExperienceOfflineSuccess",
          data: {
            ownFields: {
              title: "t3",
            },
          },
        },
      },
    } as UpdateExperienceOflineMutationResult)
    .mockResolvedValueOnce({
      data: {
        updateExperienceOffline: {
          __typename: "UpdateExperienceOfflineSuccess",
          data: {
            ownFields: {
              description: "d3",
            },
          },
        },
      },
    } as UpdateExperienceOflineMutationResult)
    .mockResolvedValueOnce({
      data: {
        updateExperienceOffline: {
          __typename: "UpdateExperienceOfflineSuccess",
          data: {
            updateDefinitions: [
              {
                id: "f1",
                name: "f3",
              },
            ],
          },
        },
      },
    } as UpdateExperienceOflineMutationResult);

  /**
   * When using the component
   */
  render(ui);

  /**
   * And title is updated
   */
  const titleInput = document.getElementById(titleInputId) as HTMLInputElement;
  fillField(titleInput, "t2");

  /**
   * Then error UI should not be visible
   */
  expect(document.getElementById(errorsNotificationId)).toBeNull();

  /**
   * And page should not be scrolled
   */
  expect(mockScrollIntoView).not.toHaveBeenCalled();

  /**
   * When form is submitted
   */
  const submitBtn = document.getElementById(submitBtnId) as HTMLButtonElement;
  submitBtn.click(); // 1

  /**
   * Then error UI should be visible
   */
  await waitForElement(() => {
    return document.getElementById(errorsNotificationId) as HTMLElement;
  });

  /**
   * And page should be scrolled
   */
  expect(mockScrollIntoView).toHaveBeenCalled();

  /**
   * When reset button is clicked
   */
  const resetBtn = document.getElementById(resetFormFieldsBtnId) as HTMLElement;
  resetBtn.click();

  /**
   * Then error UI should not be visible
   */
  expect(document.getElementById(errorsNotificationId)).toBeNull();

  /**
   * When title is updated
   */
  fillField(titleInput, "t2");

  /**
   * And form is re-submitted
   */
  submitBtn.click(); // 2

  /**
   * Then error UI should be visible
   */
  await waitForElement(() => {
    return document.getElementById(errorsNotificationId) as HTMLElement;
  });

  /**
   * And success UI should not be visible
   */
  expect(document.getElementById(successNotificationId)).toBeNull();

  /**
   * When title is updated
   */
  fillField(titleInput, "t2.");

  /**
   * And description is updated with only empty spaces
   */
  const descriptionInput = document.getElementById(
    descriptionInputId,
  ) as HTMLInputElement;

  const dWord = "d1  ";
  fillField(descriptionInput, dWord);

  /**
   * Then description input should contain updated value
   */
  expect(descriptionInput.value).toBe(dWord);

  /**
   * When form is submitted
   */
  submitBtn.click();

  /**
   * Then success UI should be visible
   */
  await waitForElement(() => {
    return document.getElementById(successNotificationId);
  });

  /**
   * And correct value should have been sent to server
   */
  let mockUpdateExperienceOfflineCalls = mockUpdateExperienceOffline.mock.calls;

  let mockUpdateExperienceOfflineArgs =
    mockUpdateExperienceOfflineCalls[
      mockUpdateExperienceOfflineCalls.length - 1
    ][0].variables.input;

  expect(mockUpdateExperienceOfflineArgs).toEqual({
    experienceId: "ex",
    ownFields: {
      title: "t2.",
    },
  });

  /**
   * And title input should be updated with server result
   */
  expect(titleInput.value).toBe("t3");

  /**
   * And description input should be updated back to default
   */
  expect(descriptionInput.value).toBe("d1");

  /**
   * When description is updated
   */
  fillField(descriptionInput, "d2");

  /**
   * And title is updated by adding empty spaces
   */
  const cWord = "   t3";
  fillField(titleInput, cWord);

  /**
   * And form is submiited
   */
  submitBtn.click();
  await wait(() => true);

  /**
   * Then description should be updated to server result
   */
  expect(descriptionInput.value).toBe("d3");

  /**
   * And title should revert back to default
   */
  expect(titleInput.value).toBe("t3");

  /**
   * And correct value should have been sent to server
   */
  mockUpdateExperienceOfflineCalls = mockUpdateExperienceOffline.mock.calls;

  mockUpdateExperienceOfflineArgs =
    mockUpdateExperienceOfflineCalls[
      mockUpdateExperienceOfflineCalls.length - 1
    ][0].variables.input;

  expect(mockUpdateExperienceOfflineArgs).toEqual({
    experienceId: "ex",
    ownFields: {
      description: "d2",
    },
  });

  mockScrollIntoView.mockReset();

  /**
   * When definition name is updated
   */
  const definitionInput = document.getElementById("f1") as HTMLInputElement;
  fillField(definitionInput, "f2");

  /**
   * Then page should not be scrolled
   */
  expect(mockScrollIntoView).not.toHaveBeenCalled();

  /**
   * When form is submiited
   */
  submitBtn.click();
  await wait(() => true);

  /**
   * Then page should be scrolled
   */
  expect(mockScrollIntoView).toHaveBeenCalled();

  /**
   * Then definition should be updated to server result
   */
  expect(definitionInput.value).toBe("f3");

  /**
   * And correct value should have been sent to server
   */
  mockUpdateExperienceOfflineCalls = mockUpdateExperienceOffline.mock.calls;

  mockUpdateExperienceOfflineArgs =
    mockUpdateExperienceOfflineCalls[
      mockUpdateExperienceOfflineCalls.length - 1
    ][0].variables.input;

  expect(mockUpdateExperienceOfflineArgs).toEqual({
    experienceId: "ex",
    updateDefinitions: [
      {
        id: "f1",
        name: "f2",
      },
    ],
  });

  /**
   * When definition is updated with only empty spaces
   */
  fillField(definitionInput, "  f3  ");

  /**
   * Then no warning UI should be visible
   */
  expect(document.getElementById(warningNotificationId)).toBeNull();

  /**
   * When form submitted
   */
  submitBtn.click();

  /**
   * Then warning UI should be visible
   */
  await waitForElement(() => {
    return document.getElementById(warningNotificationId);
  });
});

////////////////////////// HELPER FUNCTIONS ///////////////////////////////////

const EditExperienceP = EditExperience as ComponentType<Partial<Props>>;

function makeComp({
  props = {
    experience: {} as any,
  },
}: { props?: Partial<Props> } = {}) {
  return {
    ui: (
      <EditExperienceP
        updateExperiencesOnline={mockUpdateExperiencesOnline}
        parentDispatch={mockParentDispatch}
        client={client}
        updateExperienceOffline={mockUpdateExperienceOffline}
        {...props}
      />
    ),
  };
}

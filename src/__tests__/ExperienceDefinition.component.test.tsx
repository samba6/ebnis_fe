/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { ComponentType } from "react";
import { render, cleanup, wait, waitForElement } from "@testing-library/react";
import { ExperienceDefinitionComponent } from "../components/ExperienceDefinition/experience-definition.component";
import { Props } from "../components/ExperienceDefinition/experience-definition.utils";
import {
  titleInputDomId,
  descriptionInputDomId,
  notificationErrorCloseId,
  notificationWarningCloseId,
  submitDomId,
  revealDescriptionInputDomId,
  hideDescriptionInputDomId,
  definitionTypeInputDomId,
  definitionNameInputDomId,
  resetDomId,
  makeDefinitionContainerDomId,
  removeDefinitionSelector,
  moveDownDefinitionSelector,
  addDefinitionSelector,
  moveUpDefinitionSelector,
} from "../components/ExperienceDefinition/experience-definition.dom";
import { isConnected } from "../state/connections";
import { scrollIntoView } from "../components/scroll-into-view";
import { fillField } from "./test_utils";
import { CreateExperienceOfflineMutationResult } from "../components/ExperienceDefinition/experience-definition.resolvers";
import { CreateExperiencesMutationResult } from "../graphql/experiences.gql";
import { createExperiencesManualUpdate } from "../apollo-cache/create_experiences-update";
import { DataTypes } from "../graphql/apollo-types/globalTypes";

jest.mock("../components/scroll-into-view");
const mockScrollIntoView = scrollIntoView as jest.Mock;

jest.mock("../components/SidebarHeader/sidebar-header.component", () => ({
  SidebarHeader: jest.fn(() => null),
}));

let mockDataDefinitionId = 1;

jest.mock(
  "../components/ExperienceDefinition/experience-definition.injectables",
  () => ({
    addResolvers: jest.fn(),
    makeDefinitionId: () => {
      return "" + mockDataDefinitionId++;
    },
  }),
);

jest.mock("../state/connections");
const mockIsConnected = isConnected as jest.Mock;

jest.mock("../apollo-cache/create_experiences-update");
const mockCreateExperiencesManualUpdate = createExperiencesManualUpdate as jest.Mock;

const mockLoadingDomId = "a";
jest.mock("../components/Loading/loading", () => ({
  Loading: () => <div id={mockLoadingDomId} />,
}));

const mockNavigate = jest.fn();
const mockCreateExperiences = jest.fn();
const mockCreateExperienceOffline = jest.fn();

afterEach(() => {
  cleanup();
  mockIsConnected.mockReset();
  mockNavigate.mockReset();
  mockCreateExperiences.mockReset();
  mockCreateExperienceOffline.mockReset();
  mockScrollIntoView.mockReset();
  mockCreateExperiencesManualUpdate.mockReset();
});

it("renders", async () => {
  const { ui } = makeComp();

  /**
   * When component is rendered
   */
  render(ui);

  const resetDom = document.getElementById(resetDomId) as HTMLElement;
  resetDom.click();

  ////////////////////////// EMPTY FORM SUBMITTED /////////////////

  /**
   * Then warning notification should not be visible
   */
  expect(getWarningNotification()).toBeNull();

  /**
   * And page should not have been scrolled
   */
  expect(mockScrollIntoView).not.toHaveBeenCalled();

  /**
   * Field errors should not be visible
   */

  const titleInputDom = document.getElementById(
    titleInputDomId,
  ) as HTMLInputElement;

  const titleFieldDom = titleInputDom.closest(".form__field") as HTMLElement;
  const titleInputErrorDomId = titleInputDomId + "-errors";

  expect(titleFieldDom.classList).not.toContain("form__field--errors");
  expect(document.getElementById(titleInputErrorDomId)).toBeNull();

  const definitionNameInputDomId1 = definitionNameInputDomId + 1;
  const definitionNameErrorDomId1 = definitionNameInputDomId1 + "-errors";

  const definitionNameInputDom1 = document.getElementById(
    definitionNameInputDomId1,
  ) as HTMLInputElement;

  const definitionNameFieldDom1 = definitionNameInputDom1.closest(
    ".form__field",
  ) as HTMLElement;

  expect(definitionNameFieldDom1.classList).not.toContain(
    "form__field--errors",
  );
  expect(document.getElementById(definitionNameErrorDomId1)).toBeNull();

  const definitionTypeInputDomId1 = definitionTypeInputDomId + 1;
  const definitionTypeErrorDomId1 = definitionTypeInputDomId1 + "-errors";

  const definitionTypeInputDom1 = document.getElementById(
    definitionTypeInputDomId1,
  ) as HTMLSelectElement;

  const definitionTypeFieldDom1 = definitionTypeInputDom1.closest(
    ".form__field",
  ) as HTMLElement;

  expect(definitionTypeFieldDom1.classList).not.toContain(
    "form__field--errors",
  );
  expect(document.getElementById(definitionTypeErrorDomId1)).toBeNull();

  /**
   * When form is submitted
   */
  const submitDom = document.getElementById(submitDomId) as HTMLElement;
  submitDom.click();
  await wait(() => true);

  /**
   * Then warning notification should be visible
   */
  const warningNotificationDom = getWarningNotification();

  /**
   * And field errors should be visible
   */
  expect(titleFieldDom.classList).toContain("form__field--errors");
  expect(document.getElementById(titleInputErrorDomId)).not.toBeNull();
  expect(definitionNameFieldDom1.classList).toContain("form__field--errors");
  expect(document.getElementById(definitionNameErrorDomId1)).not.toBeNull();
  expect(definitionTypeFieldDom1.classList).toContain("form__field--errors");
  expect(document.getElementById(definitionTypeErrorDomId1)).not.toBeNull();

  /**
   * And page should be scrolled
   */
  expect(mockScrollIntoView).toHaveBeenCalled();
  mockScrollIntoView.mockReset();

  /**
   * When warning notification is closed
   */
  warningNotificationDom.click();

  /**
   * Then warning notification should not be visible
   */
  expect(getWarningNotification()).toBeNull();

  /**
   * When form reset button is clicked
   */
  resetDom.click();
  await wait(() => true);

  /**
   * Then errors should be cleared
   */
  expect(titleFieldDom.classList).not.toContain("form__field--errors");
  expect(document.getElementById(titleInputErrorDomId)).toBeNull();
  expect(definitionNameFieldDom1.classList).not.toContain(
    "form__field--errors",
  );
  expect(document.getElementById(definitionNameErrorDomId1)).toBeNull();
  expect(definitionTypeFieldDom1.classList).not.toContain(
    "form__field--errors",
  );
  expect(document.getElementById(definitionTypeErrorDomId1)).toBeNull();

  /**
   * And page should be scrolled
   */
  expect(mockScrollIntoView).toHaveBeenCalled();
  mockScrollIntoView.mockReset();

  ////////////////////// END EMPTY FORM SUBMITTED /////////////////

  //////////////////// TOGGLE DESCRIPTION INPUT ///////////////

  /**
   * And description input should be visible
   */

  const descriptionInputDom = document.getElementById(
    descriptionInputDomId,
  ) as HTMLInputElement;

  expect(descriptionInputDom.classList).not.toContain("form__control--hidden");

  const descriptionHideDom = document.getElementById(
    hideDescriptionInputDomId,
  ) as HTMLElement;

  /**
   * When description is hidden
   */
  descriptionHideDom.click();

  /**
   * Then description input should not be visible
   */
  expect(descriptionInputDom.classList).toContain("form__control--hidden");

  /**
   * And hide description UI should not be visible
   */
  expect(document.getElementById(hideDescriptionInputDomId)).toBeNull();

  /**
   * When description is revealed
   */
  const descriptionRevealDom = document.getElementById(
    revealDescriptionInputDomId,
  ) as HTMLElement;

  descriptionRevealDom.click();

  /**
   * Then description input should be visible
   */
  expect(descriptionInputDom.classList).not.toContain("form__control--hidden");

  /**
   * And hide description UI should be visible
   */
  expect(document.getElementById(hideDescriptionInputDomId)).not.toBeNull();

  /**
   * And reveal description UI should not be visible
   */
  expect(document.getElementById(revealDescriptionInputDomId)).toBeNull();

  //////////////////// END TOGGLE DESCRIPTION INPUT ///////////////

  ////////////////////// add/remove/move definitions //////////////

  /**
   * And remove/move/up definition should not be visible
   */
  const definitionDom1 = document.getElementById(
    makeDefinitionContainerDomId(1),
  ) as HTMLElement;

  expect(
    definitionDom1.getElementsByClassName(removeDefinitionSelector).item(0),
  ).toBeNull();

  expect(
    definitionDom1.getElementsByClassName(moveDownDefinitionSelector).item(0),
  ).toBeNull();

  expect(
    definitionDom1.getElementsByClassName(moveUpDefinitionSelector).item(0),
  ).toBeNull();

  /**
   * And a second definition UI should not be visible
   */
  expect(document.getElementById(makeDefinitionContainerDomId(2))).toBeNull();

  /**
   * When definition is added
   */
  (definitionDom1
    .getElementsByClassName(addDefinitionSelector)
    .item(0) as HTMLElement).click();

  /**
   * Then remove/move definition should be visible
   */

  expect(
    definitionDom1.getElementsByClassName(removeDefinitionSelector).item(0),
  ).not.toBeNull();

  const definitionDownDom1 = definitionDom1
    .getElementsByClassName(moveDownDefinitionSelector)
    .item(0) as HTMLElement;

  /**
   * But move up button should still not be visible
   */

  expect(
    definitionDom1.getElementsByClassName(moveUpDefinitionSelector).item(0),
  ).toBeNull();

  /**
   * Then a second definition UI should be visible
   */
  const definitionDom2 = document.getElementById(
    makeDefinitionContainerDomId(2),
  ) as HTMLElement;

  /**
   * And second definition UI should not have a down button
   * (cos it's the last)
   */
  expect(
    definitionDom2.getElementsByClassName(moveDownDefinitionSelector).item(0),
  ).toBeNull();

  /**
   * When 2nd definition add button is clicked
   */
  (definitionDom2
    .getElementsByClassName(addDefinitionSelector)
    .item(0) as HTMLElement).click();

  /**
   * Then second definition UI should now have a down button
   * (cos it's no longer the last)
   */
  expect(
    definitionDom2.getElementsByClassName(moveDownDefinitionSelector).item(0),
  ).not.toBeNull();

  /**
   * When 3rd definition's move up button is clicked
   */
  const definitionDom3 = document.getElementById(
    makeDefinitionContainerDomId(3),
  ) as HTMLElement;

  (definitionDom3
    .getElementsByClassName(moveUpDefinitionSelector)
    .item(0) as HTMLElement).click();

  /**
   * Then second definition UI should now have a down button
   * (cos it's the last again)
   */
  expect(
    definitionDom2.getElementsByClassName(moveDownDefinitionSelector).item(0),
  ).toBeNull();

  /**
   * When definition 1 down is clicked
   */
  definitionDownDom1.click();

  /**
   * Then definition 1 move up should now be visible
   */
  expect(
    definitionDom1.getElementsByClassName(moveUpDefinitionSelector).item(0),
  ).not.toBeNull();

  /**
   * When definition at position 2 is removed
   */
  (definitionDom3
    .getElementsByClassName(removeDefinitionSelector)
    .item(0) as HTMLElement).click();

  /**
   * Then definition 1 move up should not be visible
   */
  expect(
    definitionDom1.getElementsByClassName(moveUpDefinitionSelector).item(0),
  ).toBeNull();

  ////////////////////////// FORM ERRORS ////////////////////////////

  /**
   * When title field and definition 1 are completed correctly
   */
  fillField(titleInputDom, "tt");
  fillField(definitionNameInputDom1, "n1");
  fillField(definitionTypeInputDom1, "DATE");

  /**
   * And definition 2 is completed with same field name value as definition 1
   */

  const definitionNameInputDomId2 = definitionNameInputDomId + 2;

  const definitionNameInputDom2 = document.getElementById(
    definitionNameInputDomId2,
  ) as HTMLInputElement;

  fillField(definitionNameInputDom2, "n1");

  /**
   * Then definition 2 should not contain error
   */

  const definitionNameErrorDomId2 = definitionNameInputDomId2 + "-errors";

  const definitionNameFieldDom2 = definitionNameInputDom2.closest(
    ".form__field",
  ) as HTMLElement;

  expect(definitionNameFieldDom2.classList).not.toContain(
    "form__field--errors",
  );
  expect(document.getElementById(definitionNameErrorDomId2)).toBeNull();

  const definitionTypeInputDomId2 = definitionTypeInputDomId + 2;
  const definitionTypeErrorDomId2 = definitionTypeInputDomId2 + "-errors";

  const definitionTypeInputDom2 = document.getElementById(
    definitionTypeInputDomId2,
  ) as HTMLSelectElement;

  const definitionTypeFieldDom2 = definitionTypeInputDom2.closest(
    ".form__field",
  ) as HTMLElement;

  expect(definitionTypeFieldDom2.classList).not.toContain(
    "form__field--errors",
  );
  expect(document.getElementById(definitionTypeErrorDomId2)).toBeNull();

  /**
   * And error notification should not be visible
   */
  expect(document.getElementById(notificationErrorCloseId)).toBeNull();

  /**
   * When form is submitted again
   */
  submitDom.click();
  await wait(() => true);

  /**
   * Then title and definition 1 should not show errors
   */

  expect(titleFieldDom.classList).not.toContain("form__field--errors");
  expect(document.getElementById(titleInputErrorDomId)).toBeNull();
  expect(definitionNameFieldDom1.classList).not.toContain(
    "form__field--errors",
  );
  expect(document.getElementById(definitionNameErrorDomId1)).toBeNull();
  expect(definitionTypeFieldDom1.classList).not.toContain(
    "form__field--errors",
  );
  expect(document.getElementById(definitionTypeErrorDomId1)).toBeNull();

  /**
   * But definition 2 should show errors
   */

  expect(definitionNameFieldDom2.classList).toContain("form__field--errors");
  expect(document.getElementById(definitionNameErrorDomId2)).not.toBeNull();
  expect(definitionTypeFieldDom2.classList).toContain("form__field--errors");
  expect(document.getElementById(definitionTypeErrorDomId2)).not.toBeNull();

  /**
   * And error notification should be visible
   */
  let errorsNotificationDom = document.getElementById(
    notificationErrorCloseId,
  ) as HTMLElement;

  /**
   * When error notification is closed
   */
  errorsNotificationDom.click();

  /**
   * Then error notification should no longer be visible
   */
  expect(document.getElementById(notificationErrorCloseId)).toBeNull();

  /**
   * When title is completed with invalid value
   */
  fillField(titleInputDom, "a");

  /**
   * And form is submitted
   */
  submitDom.click();

  /**
   * Then title error should be visible
   */
  expect(document.getElementById(titleInputErrorDomId)).not.toBeNull();

  errorsNotificationDom = document.getElementById(
    notificationErrorCloseId,
  ) as HTMLElement;
  errorsNotificationDom.click();

  ////////////////////////// END FORM ERRORS ////////////////////////////

  /////////////////// CREATE EXPERIENCE OFFLINE /////////////////

  /**
   * When form is filled correctly
   */

  fillField(titleInputDom, "tt");
  fillField(definitionNameInputDom2, "n2");
  fillField(definitionTypeInputDom2, "INTEGER");

  /**
   * Then error notification should not be visible
   */
  expect(document.getElementById(notificationErrorCloseId)).toBeNull();

  /**
   * And loading UI should not be visible
   */
  expect(document.getElementById(mockLoadingDomId)).toBeNull();

  /**
   * When form is submitted
   */

  mockCreateExperienceOffline.mockResolvedValueOnce({
    data: {},
  } as CreateExperienceOfflineMutationResult);

  submitDom.click();

  /**
   * And loading UI should be visible
   */
  expect(document.getElementById(mockLoadingDomId)).not.toBeNull();

  /**
   * And after a while, error notification should be visible
   */
  errorsNotificationDom = await waitForElement(() => {
    return document.getElementById(notificationErrorCloseId) as HTMLElement;
  });

  /**
   * And loading UI should not be visible
   */
  expect(document.getElementById(mockLoadingDomId)).toBeNull();

  /**
   * And correct data should have been sent to the server
   */
  expect(
    mockCreateExperienceOffline.mock.calls[0][0].variables.input[0],
  ).toEqual({
    title: "tt",
    dataDefinitions: [
      {
        name: "n1",
        type: DataTypes.DATE,
      },
      {
        name: "n2",
        type: DataTypes.INTEGER,
      },
    ],
  });

  /**
   * When error notification is closed
   */
  errorsNotificationDom.click();

  /**
   * Then error notification should no longer be visible
   */
  expect(document.getElementById(notificationErrorCloseId)).toBeNull();

  /**
   * Then user should not be redirected
   */
  expect(mockNavigate).not.toHaveBeenCalled();

  /**
   * And form is submitted
   */
  mockCreateExperienceOffline.mockResolvedValueOnce({
    data: {
      createOfflineExperience: { id: "1" },
    },
  } as CreateExperienceOfflineMutationResult);

  submitDom.click();
  await wait(() => true);

  /**
   * Then user should be redirected
   */
  expect(mockNavigate).toHaveBeenCalled();

  /////////////////// END CREATE EXPERIENCE OFFLINE /////////////////

  /**
   * And definition 1 should have remove/add button visible
   */
  expect(
    definitionDom1.getElementsByClassName(removeDefinitionSelector).item(0),
  ).not.toBeNull();

  expect(
    definitionDom1.getElementsByClassName(moveDownDefinitionSelector).item(0),
  ).not.toBeNull();

  /**
   * When definition 3 is removed
   */
  (definitionDom2
    .getElementsByClassName(removeDefinitionSelector)
    .item(0) as HTMLElement).click();

  /**
   * Then definition 1 remove/add definition should not be visible
   */
  expect(
    definitionDom1.getElementsByClassName(removeDefinitionSelector).item(0),
  ).toBeNull();

  expect(
    definitionDom1.getElementsByClassName(moveDownDefinitionSelector).item(0),
  ).toBeNull();

  /////////////////// CREATE EXPERIENCE ONLINE /////////////////
  mockCreateExperiences.mockRejectedValueOnce(new Error("a"));
  mockIsConnected.mockReturnValue(true);

  /**
   * And error notification should not be visible
   */
  expect(document.getElementById(notificationErrorCloseId)).toBeNull();

  /**
   * When form is submitted
   */
  submitDom.click();

  /**
   * Then error notification should be visible
   */
  errorsNotificationDom = await waitForElement(() => {
    return document.getElementById(notificationErrorCloseId) as HTMLElement;
  });

  /**
   * When error notification is closed
   */
  errorsNotificationDom.click();

  /**
   * Then error notification should no longer be visible
   */
  expect(document.getElementById(notificationErrorCloseId)).toBeNull();

  mockCreateExperiences.mockResolvedValueOnce(
    {} as CreateExperiencesMutationResult,
  );

  /**
   * When form is submitted
   */
  submitDom.click();

  /**
   * Then error notification should be visible
   */
  errorsNotificationDom = await waitForElement(() => {
    return document.getElementById(notificationErrorCloseId) as HTMLElement;
  });

  /**
   * When error notification is closed
   */
  errorsNotificationDom.click();

  /**
   * Then error notification should no longer be visible
   */
  expect(document.getElementById(notificationErrorCloseId)).toBeNull();

  mockCreateExperiences.mockResolvedValueOnce({
    data: {
      createExperiences: [
        {
          __typename: "CreateExperienceErrors",
          errors: {
            title: "a",
            user: null,
          },
        },
      ],
    },
  } as CreateExperiencesMutationResult);

  /**
   * When form is submitted
   */
  submitDom.click();

  /**
   * Then error notification should be visible
   */
  errorsNotificationDom = await waitForElement(() => {
    return document.getElementById(notificationErrorCloseId) as HTMLElement;
  });

  /**
   * When error notification is closed
   */
  errorsNotificationDom.click();

  /**
   * Then error notification should no longer be visible
   */
  expect(document.getElementById(notificationErrorCloseId)).toBeNull();

  mockCreateExperiences.mockResolvedValueOnce({
    data: {
      createExperiences: [
        {
          __typename: "CreateExperienceErrors",
          errors: {
            user: "a",
            dataDefinitions: [
              {
                index: 0,
                name: "a",
              },
            ],
          },
        },
      ],
    },
  } as CreateExperiencesMutationResult);

  /**
   * When form is submitted
   */
  submitDom.click();

  /**
   * Then error notification should be visible
   */
  errorsNotificationDom = await waitForElement(() => {
    return document.getElementById(notificationErrorCloseId) as HTMLElement;
  });

  /**
   * When error notification is closed
   */
  errorsNotificationDom.click();

  /**
   * Then error notification should no longer be visible
   */
  expect(document.getElementById(notificationErrorCloseId)).toBeNull();

  mockCreateExperiences.mockReset();
  mockCreateExperiences.mockResolvedValueOnce({
    data: {
      createExperiences: [
        {
          __typename: "CreateExperienceErrors",
          errors: {
            dataDefinitions: [
              {
                index: 0,
                type: "a",
              },
            ],
          },
        },
      ],
    },
  } as CreateExperiencesMutationResult);

  /**
   * When description input is completed
   */
  fillField(descriptionInputDom, "aa");

  /**
   * And form is submitted
   */
  submitDom.click();

  /**
   * Then error notification should be visible
   */
  errorsNotificationDom = await waitForElement(() => {
    return document.getElementById(notificationErrorCloseId) as HTMLElement;
  });

  /**
   * And correct data must have been sent to the server
   */
  expect(mockCreateExperiences.mock.calls[0][0].variables.input[0]).toEqual({
    title: "tt",
    description: "aa",
    dataDefinitions: [
      {
        name: "n1",
        type: "DATE",
      },
    ],
  });

  /**
   * When description input is cleared
   */
  fillField(descriptionInputDom, "");

  mockNavigate.mockReset();
  mockCreateExperiences.mockReset();

  mockCreateExperiences.mockResolvedValueOnce({
    data: {
      createExperiences: [
        {
          __typename: "ExperienceSuccess",
          experience: {
            id: "a",
          },
        },
      ],
    },
  } as CreateExperiencesMutationResult);

  /**
   * When form is submitted
   */
  submitDom.click();
  await wait(() => true);

  /**
   * Then user should be redirected
   */
  expect(mockNavigate).toHaveBeenCalled();

  /**
   * And correct data should have been sent to the server
   */
  const { variables, update } = mockCreateExperiences.mock.calls[0][0];

  expect(variables.input[0]).toEqual({
    title: "tt",
    dataDefinitions: [
      {
        name: "n1",
        type: "DATE",
      },
    ],
  });

  /**
   * And cache should be updated accordingly
   */
  expect(mockCreateExperiencesManualUpdate).not.toHaveBeenCalled();
  update();
  expect(mockCreateExperiencesManualUpdate).toHaveBeenCalled();

  /////////////////// END CREATE EXPERIENCE ONLINE /////////////////
});

////////////////////////// HELPER FUNCTIONS ///////////////////////////

const ExperienceDefinitionComponentP = ExperienceDefinitionComponent as ComponentType<
  Partial<Props>
>;

function makeComp({ props = {} }: { props?: Partial<Props> } = {}) {
  return {
    ui: (
      <ExperienceDefinitionComponentP
        createExperiences={mockCreateExperiences}
        createExperienceOffline={mockCreateExperienceOffline}
        navigate={mockNavigate}
        {...props}
      />
    ),
  };
}

function getWarningNotification() {
  return document.getElementById(notificationWarningCloseId) as HTMLElement;
}

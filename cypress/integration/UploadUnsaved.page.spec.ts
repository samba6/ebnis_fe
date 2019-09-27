/* eslint-disable @typescript-eslint/no-explicit-any */
import { USER_REGISTRATION_OBJECT } from "../support/user-registration-object";
import { DataTypes } from "../../src/graphql/apollo-types/globalTypes";
import { makeExperienceRoute } from "../../src/constants/experience-route";
import {
  createSavedExperience,
  createUnsavedExperience,
} from "../support/create-experience";
import {
  createExperienceEntries,
  createUnsavedEntry,
} from "../support/create-entries";
import { PAGE_NOT_FOUND_TITLE } from "../../src/constants";
import { UPLOAD_UNSAVED_TITLE } from "../../src/constants/upload-unsaved-title";
import { persistCache } from "../support/mutate";

context("Upload unsaved page", () => {
  beforeEach(() => {
    cy.checkoutSession();
    cy.registerUser(USER_REGISTRATION_OBJECT);
  });

  it("uploads unsaved data successfully", () => {
    const savedExperiencePromise = createSavedExperience({
      title: "saved-1",
      dataDefinitions: [
        {
          name: "f1",
          type: DataTypes.INTEGER,
        },
      ],
    }).then(experience => {
      const { id, dataDefinitions } = experience;

      const saved = createExperienceEntries([
        {
          dataObjects: [
            {
              definitionId: dataDefinitions[0].id,
              data: `{"integer":"1"}`,
            },
          ],
          experienceId: id,
          clientId: "1",
        },
      ]);

      const unsaved = createUnsavedEntry({
        experience,
        dataObjects: [
          {
            data: `{"integer":"2"}`,
            definitionId: dataDefinitions[0].id,
          },
        ],
      });

      return Promise.all([saved, unsaved]).then(() => {
        return experience;
      });
    });

    const unsavedExperienceTitle = "olu omo";

    const unsavedExperiencePromise = createUnsavedExperience({
      title: unsavedExperienceTitle,
      dataDefinitions: [
        {
          name: "f2",
          type: DataTypes.INTEGER,
        },
      ],
    }).then(unsavedExperience => {
      const { dataDefinitions } = unsavedExperience;

      return createUnsavedEntry({
        experience: unsavedExperience,
        dataObjects: [
          {
            data: `{"integer":"3"}`,
            definitionId: dataDefinitions[0].id,
          },
        ],
      }).then(() => {
        return unsavedExperience;
      });
    });

    let experiencesPromises = Promise.all([
      savedExperiencePromise,
      unsavedExperiencePromise,
    ]).then(result => {
      return persistCache().then(() => {
        return result;
      });
    });

    cy.wrap(experiencesPromises).then(([, unsavedExperience]) => {
      const { id: unsavedId } = unsavedExperience;
      const unsavedRoute = makeExperienceRoute(unsavedId);

      cy.visit(unsavedRoute);

      let uploadSuccessRegexp = /^upload-triggered-icon-success-(.+?)$/;
      let savedId: string;

      cy.title().should("contain", unsavedExperienceTitle);

      cy.get("#header-unsaved-count-label").click();
      cy.title().should("contain", UPLOAD_UNSAVED_TITLE);
      cy.get("#upload-unsaved-tab-menu-never-saved").click();
      cy.get("#upload-unsaved-upload-btn").click();

      cy.get(
        ".unsaved-experience--success .experience-title__success-icon",
      ).then($elm => {
        savedId = uploadSuccessRegexp.exec($elm.attr("id"))[1];

        cy.visit(makeExperienceRoute(savedId));
        cy.title().should("contain", unsavedExperienceTitle);

        cy.visit(unsavedRoute);
        cy.title().should("contain", PAGE_NOT_FOUND_TITLE);
      });
    });
  });
});

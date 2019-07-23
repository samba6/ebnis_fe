/* eslint-disable @typescript-eslint/no-explicit-any */
import { USER_REGISTRATION_OBJECT } from "../support/user-registration-object";
import { FieldType } from "../../src/graphql/apollo-types/globalTypes";
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
      fieldDefs: [
        {
          name: "f1",
          type: FieldType.INTEGER,
        },
      ],
    }).then(experience => {
      const { id, fieldDefs } = experience;

      const saved = createExperienceEntries(id, [
        {
          fields: [
            {
              defId: fieldDefs[0].id,
              data: `{"integer":"1"}`,
            },
          ],
          expId: id,
        },
      ]);

      const unsaved = createUnsavedEntry({
        experience,
        fields: [
          {
            data: `{"integer":"2"}`,
            defId: fieldDefs[0].id,
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
      fieldDefs: [
        {
          name: "f2",
          type: FieldType.INTEGER,
        },
      ],
    }).then(unsavedExperience => {
      const { fieldDefs } = unsavedExperience;

      return createUnsavedEntry({
        experience: unsavedExperience,
        fields: [
          {
            data: `{"integer":"3"}`,
            defId: fieldDefs[0].id,
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
      let savedId;

      cy.title().should("contain", unsavedExperienceTitle);

      cy.get("#header-unsaved-count-label").click();
      cy.title().should("contain", UPLOAD_UNSAVED_TITLE);
      cy.get("#upload-unsaved-unsaved-experiences-menu").click();
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

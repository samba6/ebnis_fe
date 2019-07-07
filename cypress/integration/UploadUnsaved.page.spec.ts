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
import { persistCache } from "../support/mutate";
import { PAGE_NOT_FOUND_TITLE } from "../../src/constants";
import { UPLOAD_UNSAVED_TITLE } from "../../src/constants/upload-unsaved-title";

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

    const unsavedExperiencePromise = createUnsavedExperience({
      title: "olu omo",
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

    let p = Promise.all([
      savedExperiencePromise,
      unsavedExperiencePromise,
    ]).then(result => {
      return persistCache().then(() => {
        return result;
      });
    });

    cy.wrap(p).then(([, unsavedExperience]) => {
      const { id } = unsavedExperience;
      const unsavedRoute = makeExperienceRoute(id);

      cy.visit(unsavedRoute);

      let title;
      let titleRegexp = /^unsaved-experience-(.+?)-title$/;
      let uploadSuccessRegexp = /^upload-triggered-icon-success-(.+?)$/;
      let newId;

      cy.title()
        .should("contain", "olu omo")
        .then(t => {
          title = t;
        })
        .then(() => {
          cy.getByTestId("unsaved-count-label").click();
          cy.title().should("contain", UPLOAD_UNSAVED_TITLE);
          cy.getByTestId("unsaved-experiences-menu").click();

          return cy.getByTestId(titleRegexp);
        })
        .then(elm => {
          const sameId = titleRegexp.exec((elm as any).attr("data-testid"))[1];

          expect(id).to.eq(sameId);
          cy.getByTestId("upload-all").click();

          return cy
            .get(".unsaved-experience--success .experience-title__success-icon")
            .should("exist");
        })
        .then(elm => {
          newId = uploadSuccessRegexp.exec((elm as any).attr("data-testid"))[1];

          expect(id).not.to.eq(newId);

          cy.visit(makeExperienceRoute(newId));
          cy.title().should("eq", title);

          cy.visit(unsavedRoute);
          cy.title().should("contain", PAGE_NOT_FOUND_TITLE);
        });
    });
  });
});

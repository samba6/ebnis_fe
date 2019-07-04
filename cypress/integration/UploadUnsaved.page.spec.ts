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

context("Upload unsaved page", () => {
  beforeEach(() => {
    cy.closeSession();
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
      title: "unsaved",
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

    return Promise.all([savedExperiencePromise, unsavedExperiencePromise])
      .then(result => {
        return persistCache().then(isPersisted => {
          expect(isPersisted).to.eq(true);

          return result;
        });
      })
      .then(([, unsavedExperience]) => {
        const { id } = unsavedExperience;
        const unsavedRoute = makeExperienceRoute(id);

        cy.visit(unsavedRoute);

        cy.url().should("contain", id);

        cy.getByTestId("unsaved-count-label").click();

        cy.title().should("contain", "Unsaved");

        cy.queryByTestId(
          "upload-triggered-icon-success-saved-experiences",
        ).should("not.exist");

        cy.queryByTestId(
          "upload-triggered-icon-success-unsaved-experiences",
        ).should("not.exist");

        cy.getByTestId("upload-all").click();

        cy.getByTestId(
          "upload-triggered-icon-success-saved-experiences",
        ).should("exist");

        cy.getByTestId(
          "upload-triggered-icon-success-unsaved-experiences",
        ).should("exist");

        cy.visit(unsavedRoute);
        const url = cy.url();
        url.should("not.contain", id);
      });
  });
});

/* eslint-disable @typescript-eslint/no-explicit-any */
import { USER_REGISTRATION_OBJECT } from "../support/user-registration-object";
import { DataTypes } from "../../src/graphql/apollo-types/globalTypes";
import { EXPERIENCE_DEFINITION_URL } from "../../src/routes";
import { EXPERIENCE_DEFINITION_TITLE } from "../../src/constants/experience-definition-title";
import { createSavedExperience } from "../support/create-experience";

context("experience definition page", () => {
  beforeEach(() => {
    cy.checkoutSession();
    cy.registerUser(USER_REGISTRATION_OBJECT);
  });

  it("succeeds when online", () => {
    /**
     * Given we are on experiences page
     */
    cy.visit(EXPERIENCE_DEFINITION_URL);

    /**
     * Then we should see the page title
     */
    cy.title().should("contain", EXPERIENCE_DEFINITION_TITLE);

    /**
     * When we complete the title field with new experience definition title
     */
    const title = "new experience title";
    cy.get("#experience-definition-title-input").type(title);

    /**
     * And we complete the description field
     */
    cy.get("#experience-definition-description-input").type(
      "new experience description",
    );

    /**
     * And we complete the field name field
     */
    cy.get("#field-name-0").type("experience field 1");

    /**
     * And we click on field type
     */
    cy.get("#experience-data-type-0")
      .click()
      .then($fieldType => {
        ($fieldType[0].getElementsByClassName("js-DATETIME")[0] as any).click();
      });

    /**
     * And submit the form
     */
    cy.get("#experience-definition-submit-btn").click();

    /**
     * Then we should see the new title we just created
     */
    cy.title().should("contain", title);
  });

  it("fails when online and title already exists", () => {
    /**
     * Given that an experience definition with known title exists in the
     * system
     */
    const title = "new experience title";

    let p = createSavedExperience({
      title,
      dataDefinitions: [
        {
          type: DataTypes.DATE,
          name: "Some random field",
        },
      ],
    });

    cy.wrap(p).then(() => {
      /**
       * When we visit the page
       */
      cy.visit(EXPERIENCE_DEFINITION_URL);

      /**
       * Then we should not see any error
       */
      cy.get("#experience-definition-errors-summary").should("not.exist");

      /**
       * And complete the form with same title as in the system and submit
       */

      cy.get("#experience-definition-title-input").type(title);

      cy.get("#field-name-0").type("experience field 1");

      cy.get("#experience-data-type-0")
        .click()
        .then($fieldType => {
          ($fieldType[0].getElementsByClassName(
            "js-MULTI_LINE_TEXT",
          )[0] as any).click();
        });

      cy.get("#experience-definition-submit-btn").click();

      /**
       * Then we should see error
       */
      cy.get("#experience-definition-errors-summary").should("exist");
    });
  });

  it("succeeds when offline", () => {
    /**
     * Given we are on experiences page
     */
    cy.visit(EXPERIENCE_DEFINITION_URL);

    /**
     * Then we should see the page title
     */
    cy.title().should("contain", EXPERIENCE_DEFINITION_TITLE);

    cy.setConnectionStatus(false);

    /**
     * When we complete the title field with new experience definition title
     */
    const title = "new experience title";
    cy.get("#experience-definition-title-input").type(title);

    /**
     * And we complete the description field
     */
    cy.get("#experience-definition-description-input").type(
      "new experience description",
    );

    /**
     * And we complete the field name field
     */
    cy.get("#field-name-0").type("experience field 1");

    /**
     * And we click on field type
     */
    cy.get("#experience-data-type-0")
      .click()
      .then($fieldType => {
        ($fieldType[0].getElementsByClassName("js-DATETIME")[0] as any).click();
      });

    /**
     * And submit the form
     */
    cy.get("#experience-definition-submit-btn").click();

    /**
     * Then we should see the new title we just created
     */
    cy.title().should("contain", title);
  });
});

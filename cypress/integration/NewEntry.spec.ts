import { USER_REGISTRATION_OBJECT } from "../support/user-registration-object";
import { FieldType } from "../../src/graphql/apollo-types/globalTypes";
import { makeNewEntryRoute } from "../../src/constants/new-entry-route";
import { ManualConnectionStatus } from "../../src/test-utils/manual-connection-setting";
import {
  createSavedExperience,
  createUnsavedExperience,
} from "../support/create-experience";
import { ExperienceFragment } from "../../src/graphql/apollo-types/ExperienceFragment";

context("new experience entry page", () => {
  beforeEach(() => {
    cy.checkoutSession();
    cy.registerUser(USER_REGISTRATION_OBJECT);
  });

  const title = "My experience no. 1";

  it("creates entry for unsaved experience successfully when user offline", () => {
    /**
     * Given there is an unsaved experience in the system
     */
    const fieldName = "Total purchases";

    let p = createUnsavedExperience(
      {
        title,
        fieldDefs: [
          {
            name: fieldName,
            type: FieldType.INTEGER,
          },
        ],
      },

      { persist: true },
    );

    cy.wrap(p).then(result => {
      let experience = result as ExperienceFragment;
      /**
       * And user wishes to create new entry
       */
      const fieldValue = "4567890";
      const fieldValueRegex = new RegExp(fieldValue);

      /**
       * When we visit new entry page
       */
      cy.visit(makeNewEntryRoute(experience.id));

      /**
       * Then we should see the title
       */
      cy.title().should("contain", `[New Entry] ${title}`);

      /**
       * And data user wishes to create should not exist on page
       */
      cy.queryByText(fieldValueRegex).should("not.exist");

      cy.setConnectionStatus(ManualConnectionStatus.disconnected);

      /**
       * When user completes and submits the form
       */
      cy.getByLabelText(new RegExp(fieldName, "i")).type(fieldValue);
      cy.getByText(/submit/i).click();

      /**
       * Then user should redirected to experience page
       */
      cy.title().should("not.contain", `[New Entry]`);
      cy.title().should("contain", title);

      /**
       * And data user wishes to create should exist on page
       */
      cy.getByText(fieldValueRegex).should("exist");
    });
  });

  it("creates entry successfully when user online", () => {
    /**
     * Given there is an experience in the system with no entries
     */
    const fieldName = "Total purchases";

    let p = createSavedExperience(
      {
        title,
        fieldDefs: [
          {
            name: fieldName,
            type: FieldType.INTEGER,
          },
        ],
      },
      // { persist: true },
    );

    cy.wrap(p).then(result => {
      let experience = result as ExperienceFragment;

      /**
       * And user wishes to create new entry
       */
      const fieldValue = "4567890";
      const fieldValueRegex = new RegExp(fieldValue);

      /**
       * When we visit new entry page
       */
      cy.visit(makeNewEntryRoute(experience.id));

      /**
       * Then we should see the title
       */
      cy.title().should("contain", `[New Entry] ${title}`);

      /**
       * And data user wishes to create should not exist on page
       */
      cy.queryByText(fieldValueRegex).should("not.exist");

      /**
       * When user completes and submits the form
       */
      cy.getByLabelText(new RegExp(fieldName, "i")).type(fieldValue);
      cy.getByText(/submit/i).click();

      /**
       * Then user should redirected to experience page
       */
      cy.title().should("not.contain", `[New Entry]`);
      cy.title().should("contain", title);

      /**
       * And data user wishes to create should exist on page
       */
      cy.getByText(fieldValueRegex).should("exist");
    });
  });

  it("creates entry for saved experience successfully when user offline", () => {
    /**
     * Given there is an online experience in the system
     */
    const fieldName = "Total purchases";

    let p = createSavedExperience({
      title,
      fieldDefs: [
        {
          name: fieldName,
          type: FieldType.INTEGER,
        },
      ],
    });

    cy.wrap(p).then(result => {
      let experience = result as ExperienceFragment;

      /**
       * And user wishes to create new entry
       */
      const fieldValue = "4567890";
      const fieldValueRegex = new RegExp(fieldValue);

      /**
       * When we visit new entry page
       */
      cy.visit(makeNewEntryRoute(experience.id));

      /**
       * Then we should see the title
       */
      cy.title().should("contain", `[New Entry] ${title}`);

      /**
       * And data user wishes to create should not exist on page
       */
      cy.queryByText(fieldValueRegex).should("not.exist");

      cy.setConnectionStatus(ManualConnectionStatus.disconnected);

      /**
       * When user completes and submits the form
       */
      cy.getByLabelText(new RegExp(fieldName, "i")).type(fieldValue);
      cy.getByText(/submit/i).click();

      /**
       * Then user should redirected to experience page
       */
      cy.title().should("not.contain", `[New Entry]`);
      cy.title().should("contain", title);

      /**
       * And data user wishes to create should exist on page
       */
      cy.getByText(fieldValueRegex).should("exist");
    });
  });
});

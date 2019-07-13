import { USER_REGISTRATION_OBJECT } from "../support/user-registration-object";
import { FieldType } from "../../src/graphql/apollo-types/globalTypes";
import { EXPERIENCES_URL } from "../../src/routes";
import { getDescendantByText } from "../support/get-descendant-by-text";
import { EXPERIENCE_DEFINITION_TITLE } from "../../src/constants/experience-definition-title";
import { MY_EXPERIENCES_TITLE } from "../../src/constants/my-experiences-title";
import { createSavedExperience } from "../support/create-experience";
import { persistCache } from "../support/mutate";

const title = "My experience no. 1";

context("my experiences page", () => {
  beforeEach(() => {
    cy.checkoutSession();
    cy.registerUser(USER_REGISTRATION_OBJECT);
  });

  it("navigates to definition page from text", () => {
    /**
     * When we visit experiences page
     */

    cy.visit(EXPERIENCES_URL);

    /**
     * Then we should see the title
     */
    cy.title().should("contain", MY_EXPERIENCES_TITLE);

    /**
     * When we click on link to create new experience
     */
    cy.getByText("Click here to create your first experience").click();

    /**
     * Then we should be taken to new experience definition page
     */
    cy.title().should("contain", EXPERIENCE_DEFINITION_TITLE);
  });

  it("navigates to definition page from button", () => {
    /**
     * When we visit experiences page
     */

    cy.visit(EXPERIENCES_URL);

    /**
     * And click on the button
     */
    cy.getByText("+").click();

    /**
     * Then we should be taken to new experience definition page
     */
    cy.title().should("contain", EXPERIENCE_DEFINITION_TITLE);
  });

  it("navigates to entry page", () => {
    /**
     * Given there is an experience in the system
     */
    let p = createSavedExperience({
      title,
      fieldDefs: [
        {
          name: "Field integer",
          type: FieldType.INTEGER,
        },
      ],
    }).then(experience => {
      return persistCache().then(() => {
        return experience;
      });
    });

    cy.wrap(p).then(() => {
      /**
       * And we are at my experiences page
       */
      cy.visit(EXPERIENCES_URL);

      /**
       * When we click on the title of experience to which we want to add entry
       */
      cy.get('[data-testid="exps-container"]').then($node => {
        getDescendantByText(title, $node).click();
      });

      /**
       * Then we should be directed to the experience's detailed page
       */
      cy.title().should("contain", title);

      /**
       * When we click on "No entries" link
       */
      cy.getByText("No entries. Click here to add one").click();

      /**
       * Then we should be directed to entry page for the experience
       */
      cy.title().should("contain", `[New Entry] ${title}`);
    });
  });
});

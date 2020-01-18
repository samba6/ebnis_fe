import { USER_REGISTRATION_OBJECT } from "../support/user-registration-object";
import { DataTypes } from "../../src/graphql/apollo-types/globalTypes";
import { EXPERIENCES_URL } from "../../src/routes";
import { EXPERIENCE_DEFINITION_TITLE } from "../../src/constants/experience-definition-title";
import { MY_EXPERIENCES_TITLE } from "../../src/constants/my-experiences-title";
import { createSavedExperience } from "../support/create-experience";
import { persistCache } from "../support/mutate";
import { ExperienceFragment } from "../../src/graphql/apollo-types/ExperienceFragment";
import { makeExperienceHeaderDomId } from "../../src/components/MyExperiences/my-experiences.dom";

const title = "aa";

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
    cy.get("#no-experiences-info").click();

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
    cy.get("#new-experience-button").click();

    /**
     * Then we should be taken to new experience definition page
     */
    cy.title().should("contain", EXPERIENCE_DEFINITION_TITLE);
  });

  it("navigates to entry page", () => {
    /**
     * Given there is an experience in the system
     */
    const p = createSavedExperience({
      title,
      dataDefinitions: [
        {
          name: "Field integer",
          type: DataTypes.INTEGER,
        },
      ],
    }).then(experience => {
      return persistCache().then(() => {
        return experience;
      });
    });

    cy.wrap(p).then((experience: ExperienceFragment) => {
      const { id } = experience;
      /**
       * And we are at my experiences page
       */
      cy.visit(EXPERIENCES_URL);

      /**
       * When we click on the title of experience to which we want to add entry
       */
      cy.get("#" + makeExperienceHeaderDomId(id)).click();

      /**
       * Then we should be directed to the experience's detailed page
       */
      cy.title().should("contain", title);

      /**
       * When we click on "No entries" link
       */
      cy.get("#experience-no-entries").click();

      /**
       * Then we should be directed to entry page for the experience
       */
      cy.title().should("contain", `[New Entry] ${title}`);
    });
  });
});

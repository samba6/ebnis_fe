import { USER_REGISTRATION_OBJECT } from "../support/user-registration-object";
import { makeExperienceRoute } from "../../src/constants/experience-route";
import { FieldType } from "../../src/graphql/apollo-types/globalTypes";

const title = "My experience no. 1";

context("experience page", () => {
  beforeEach(() => {
    cy.closeSession();
    cy.checkoutSession();
    cy.registerUser(USER_REGISTRATION_OBJECT);
  });

  it("shows that there are no entries", () => {
    /**
     * Given there is an experience in the system with no entries
     */
    cy.defineExperience({
      title,
      fieldDefs: [
        {
          name: "Field integer",
          type: FieldType.INTEGER
        }
      ]
    }).then(experience => {
      /**
       * When we visit experience page
       */

      cy.visit(makeExperienceRoute(experience.id));

      /**
       * Then we should see the title
       */
      cy.title().should("contain", title);

      /**
       * When we click on 'no entry' link
       */
      cy.getByTestId("no-entries").click();

      /**
       * Then we should be redirected to new entry page
       */
      cy.title().should("contain", `[New Entry] ${title}`);
    });
  });

  it("list entries", () => {
    /**
     * Given there is an experience in the system with entries
     */
    cy.defineExperience({
      title,
      fieldDefs: [
        {
          name: "Field integer",
          type: FieldType.INTEGER
        }
      ]
    })
      .then(experience => {
        return cy.createExperienceEntries(
          experience,
          [1, 2, 3].map(int =>
            experience.fieldDefs.map(({ id: defId }) => ({
              defId,
              data: JSON.stringify({ integer: int })
            }))
          )
        );
      })
      .then(([experience]) => {
        /**
         * When we visit experience page
         */

        cy.visit(makeExperienceRoute(experience.id));

        /**
         * Then there should be 3 fields on the page
         */
        cy.getAllByTestId("entry-container").then(nodes => {
          expect(nodes.length).to.eq(3);
        });

        /**
         * When we click on the button
         */
        cy.getByTestId("new-exp-entry-button").click();

        /**
         * Then we should be redirected to new entry page
         */
        cy.title().should("contain", `[New Entry] ${title}`);
      });
  });
});

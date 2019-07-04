import { USER_REGISTRATION_OBJECT } from "../support/user-registration-object";
import { makeExperienceRoute } from "../../src/constants/experience-route";
import { FieldType } from "../../src/graphql/apollo-types/globalTypes";
import { ExperienceFragment } from "../../src/graphql/apollo-types/ExperienceFragment";
import { createSavedExperience } from "../support/create-experience";
import { createExperienceEntries } from "../support/create-entries";

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
    return createSavedExperience({
      title,
      fieldDefs: [
        {
          name: "Field integer",
          type: FieldType.INTEGER,
        },
      ],
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
    return createSavedExperience({
      title,
      fieldDefs: [
        {
          name: "Field integer",
          type: FieldType.INTEGER,
        },
      ],
    })
      .then(experience => {
        const id = experience.id;
        const [field] = experience.fieldDefs;
        const { id: defId } = field;

        return createExperienceEntries(
          id,
          [1, 2, 3].map(int => {
            return {
              expId: id,
              clientId: int + "",
              fields: [
                {
                  defId,
                  data: JSON.stringify({ integer: int }),
                },
              ],
            };
          }),
        ).then(entries => {
          return [experience, entries];
        });
      })
      .then(([experience]: [ExperienceFragment]) => {
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
         * When we click new experience button in the menu
         */
        cy.getByTestId("experience-options-menu").click();
        cy.getByTestId(`experience-${experience.id}-new-entry-button`).click();

        /**
         * Then we should be redirected to new entry page
         */
        cy.title().should("contain", `[New Entry] ${title}`);
      });
  });
});

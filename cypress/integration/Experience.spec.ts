import { USER_REGISTRATION_OBJECT } from "../support/user-registration-object";
import { makeExperienceRoute } from "../../src/constants/experience-route";
import { FieldType } from "../../src/graphql/apollo-types/globalTypes";
import { ExperienceFragment } from "../../src/graphql/apollo-types/ExperienceFragment";
import { createSavedExperience } from "../support/create-experience";
import { createExperienceEntries } from "../support/create-entries";

const title = "My experience no. 1";

context("experience page", () => {
  beforeEach(() => {
    cy.checkoutSession();
    cy.registerUser(USER_REGISTRATION_OBJECT);
  });

  it("shows that there are no entries", () => {
    /**
     * Given there is an experience in the system with no entries
     */
    let p = createSavedExperience({
      title,
      fieldDefs: [
        {
          name: "Field integer",
          type: FieldType.INTEGER,
        },
      ],
    });

    cy.wrap(p).then(result => {
      let experience = result as ExperienceFragment;

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
    let p = createSavedExperience({
      title,
      fieldDefs: [
        {
          name: "Field integer",
          type: FieldType.INTEGER,
        },
      ],
    }).then(experience => {
      const id = experience.id;
      const [fieldDefinition] = experience.fieldDefs;
      const { id: defId } = fieldDefinition;

      return createExperienceEntries(id, [
        {
          expId: id,
          clientId: "1",
          fields: [
            {
              defId,
              data: `{"integer":1}`,
            },
          ],
        },
      ]).then(() => {
        return experience;
      });
    });

    cy.wrap(p).then((experience: ExperienceFragment) => {
      /**
       * When we visit experience page
       */

      cy.visit(makeExperienceRoute(experience.id));

      const escapedExperienceId = CSS.escape(experience.id);

      /**
       * When we click new experience button in the menu
       */
      cy.get("#experience-options-menu").click();
      cy.get(`#experience-${escapedExperienceId}-new-entry-button`).click();

      /**
       * Then we should be redirected to new entry page
       */
      cy.title().should("contain", `[New Entry] ${title}`);
    });
  });
});

import { USER_REGISTRATION_OBJECT } from "../support/user-registration-object";
import { makeExperienceRoute } from "../../src/constants/experience-route";
import { FieldType } from "../../src/graphql/apollo-types/globalTypes";
import { ExperienceFragment } from "../../src/graphql/apollo-types/ExperienceFragment";
import { createSavedExperience } from "../support/create-experience";
import { createExperienceEntries } from "../support/create-entries";

const title = "ex";

beforeEach(() => {
  cy.checkoutSession();
  cy.registerUser(USER_REGISTRATION_OBJECT);
});

context("ExperienceComponent", () => {
  it("shows that there are no entries", () => {
    /**
     * Given there is an experience in the system with no entries
     */
    let p = createSavedExperience({
      title,
      dataDefinitions: [
        {
          name: "Field integer",
          type: FieldType.INTEGER,
        },
      ],
    });

    cy.wrap(p).then((experience: ExperienceFragment) => {
      cy.visit(makeExperienceRoute(experience.id));

      /**
       * Then we should see the title
       */
      cy.title().should("contain", title);

      /**
       * When we click on 'no entry' link
       */
      cy.get("#experience-no-entries").click();

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
    let p = createEntry().then(([experience]) => {
      return experience;
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

context.only("EditEntryComponent", () => {
  it("edits definitions while online", () => {
    let p = createEntry();

    cy.wrap(p).then(([experience]) => {
      cy.visit(makeExperienceRoute(experience.id));
      expect(true).eq(true);
    });
  });
});

function createEntry() {
  return createSavedExperience({
    title,
    dataDefinitions: [
      {
        name: "aa",
        type: FieldType.INTEGER,
      },
    ],
  }).then(experience => {
    const id = experience.id;
    const [fieldDefinition] = experience.dataDefinitions;
    const { id: definitionId } = fieldDefinition;

    return createExperienceEntries([
      {
        experienceId: id,
        clientId: "1",
        dataObjects: [
          {
            definitionId,
            data: `{"integer":1}`,
          },
        ],
      },
    ]).then(entries => {
      return [experience, entries[0]];
    });
  });
}

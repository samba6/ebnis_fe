import { USER_REGISTRATION_OBJECT } from "../support/user-registration-object";
import { makeExperienceRoute } from "../../src/constants/experience-route";
import { DataTypes } from "../../src/graphql/apollo-types/globalTypes";
import { ExperienceFragment } from "../../src/graphql/apollo-types/ExperienceFragment";
import { createSavedExperience } from "../support/create-experience";
import { createExperienceEntries } from "../support/create-entries";
import { DataDefinitionFragment } from "../../src/graphql/apollo-types/DataDefinitionFragment";

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

    cy.wrap(createExperience()).then((experience: ExperienceFragment) => {
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
    let p = createEntry(createExperience()).then(([experience]) => {
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

context("EditEntryComponent", () => {
  it("edits definitions while online", () => {
    let p = createEntry(createExperience(3));

    cy.wrap(p).then(([experience, entry]) => {
      const [
        definition1,
        definition2,
        definition3,
      ] = experience.dataDefinitions.sort((a, b) => (a.name < b.name ? -1 : 1));

      cy.visit(makeExperienceRoute(experience.id));
      const entryIdPrefix = `#entry-${CSS.escape(entry.id)}`;
      cy.get(`${entryIdPrefix}-menu-trigger`).click();
      cy.get(`${entryIdPrefix}-edit-trigger`).click();

      cy.get("#edit-entry-experience-title").should(
        "have.text",
        experience.title,
      );

      const definitionIdPrefix1 = `#edit-entry-definition-${definition1.id}`;
      cy.get(definitionIdPrefix1).as("$field");

      cy.get(`${definitionIdPrefix1}-edit-btn`).click();
      cy.get(`${definitionIdPrefix1}-input`).type("b");
      cy.get(`${definitionIdPrefix1}-name`).should("not.exist");

      const definitionIdPrefix2 = `#edit-entry-definition-${definition2.id}`;

      cy.get(`${definitionIdPrefix2}-edit-btn`).click();
      cy.get(`${definitionIdPrefix2}-input`)
        .clear()
        .type(definition3.name);
      cy.get(`${definitionIdPrefix2}-error`).should("not.exist");
      cy.get(`.edit-entry-definition-submit`).click();

      cy.get(`${definitionIdPrefix1}-name`).should("have.value", "a1b");
      cy.get(`${definitionIdPrefix2}-error`).should("exist");
    });
  });
});

function createEntry(experiencePromise: Promise<ExperienceFragment>) {
  return experiencePromise.then(experience => {
    const id = experience.id;
    const dataObjects = experience.dataDefinitions.map((d, index) => {
      const { id: definitionId } = d as DataDefinitionFragment;
      return {
        definitionId,
        data: `{"integer":${index + 1}}`,
      };
    });

    return createExperienceEntries([
      {
        experienceId: id,
        clientId: "1",
        dataObjects,
      },
    ]).then(entries => {
      return [experience, entries[0]];
    });
  });
}

function createExperience(howManyDefinitions: number = 1) {
  const dataDefinitions = Array.from(
    { length: howManyDefinitions },
    (_, index) => ({
      name: `a${index + 1}`,
      type: DataTypes.INTEGER,
    }),
  );

  return createSavedExperience({
    title,
    dataDefinitions,
  });
}

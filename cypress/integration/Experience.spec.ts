import { USER_REGISTRATION_OBJECT } from "../support/user-registration-object";
import { makeExperienceRoute } from "../../src/constants/experience-route";
import { DataTypes } from "../../src/graphql/apollo-types/globalTypes";
import { ExperienceFragment } from "../../src/graphql/apollo-types/ExperienceFragment";
import { createSavedExperience } from "../support/create-experience";
import { createExperienceEntries } from "../support/create-entries";
import { DataDefinitionFragment } from "../../src/graphql/apollo-types/DataDefinitionFragment";
import {
  getDefinitionControlId,
  ControlName,
} from "../../src/components/EditEntry/edit-entry-dom";
import { newEntryTriggerId } from "../../src/components/Experience/experience.dom";

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
    const p = createEntry(createExperience()).then(([experience]) => {
      return experience;
    });

    cy.wrap(p).then((experience: ExperienceFragment) => {
      const { id } = experience;
      /**
       * When we visit experience page
       */

      cy.visit(makeExperienceRoute(id));

      /**
       * When we click new experience button in the menu
       */
      cy.get("#experience-options-menu").click();
      cy.get("#" + newEntryTriggerId).click();

      /**
       * Then we should be redirected to new entry page
       */
      cy.title().should("contain", `[New Entry] ${title}`);
    });
  });
});

context("EditEntryComponent", () => {
  it("edits definitions while online", () => {
    const p = createEntry(createExperience(3));

    cy.wrap(p).then(([experience, entry]) => {
      const [
        definition1,
        definition2,
        definition3,
      ] = experience.dataDefinitions.sort((a, b) => (a.name < b.name ? -1 : 1));

      cy.visit(makeExperienceRoute(experience.id));
      const entryIdPrefix = `#entry-${entry.id}`;
      cy.get(`${entryIdPrefix}-menu-trigger`).click();
      cy.get(`${entryIdPrefix}-edit-trigger`).click();

      cy.get("#edit-entry-experience-title").should(
        "have.text",
        experience.title,
      );

      const definitionId1 = definition1.id;

      cy.get(
        "#" + getDefinitionControlId(definitionId1, ControlName.edit),
      ).click();

      cy.get(
        "#" + getDefinitionControlId(definitionId1, ControlName.input),
      ).type("b");

      cy.get(
        "#" + getDefinitionControlId(definitionId1, ControlName.name),
      ).should("not.exist");

      const definitionId2 = definition2.id;

      cy.get(
        "#" + getDefinitionControlId(definitionId2, ControlName.edit),
      ).click();

      cy.get("#" + getDefinitionControlId(definitionId2, ControlName.input))
        .clear()
        .type(definition3.name);

      cy.get(
        "#" + getDefinitionControlId(definitionId2, ControlName.error),
      ).should("not.exist");

      cy.get(`.edit-entry-definition-submit`).click();

      cy.get(
        "#" + getDefinitionControlId(definitionId1, ControlName.name),
      ).should("have.value", "a1b");

      cy.get(
        "#" + getDefinitionControlId(definitionId2, ControlName.error),
      ).should("exist");
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

function createExperience(howManyDefinitions = 1) {
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

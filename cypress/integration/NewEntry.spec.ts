import { USER_REGISTRATION_OBJECT } from "../support/user-registration-object";
import { DataTypes } from "../../src/graphql/apollo-types/globalTypes";
import { makeNewEntryRoute } from "../../src/constants/new-entry-route";
import {
  createOnlineExperience,
  createOfflineExperience,
} from "../support/create-experience";
import { ExperienceFragment } from "../../src/graphql/apollo-types/ExperienceFragment";
import { OFFLINE_ID_PREFIX } from "../../src/constants";
import {
  submitBtnDomId,
  makeFieldInputId,
} from "../../src/components/NewEntry/new-entry.dom";

context("new entry page", () => {
  beforeEach(() => {
    cy.checkoutSession();
    cy.registerUser(USER_REGISTRATION_OBJECT);
  });

  const title = "tt";

  it("creates entry successfully when user online", () => {
    /**
     * Given there is an experience in the system with no entries
     */
    const fieldName = "aa";

    const p = createOnlineExperience({
      title,
      dataDefinitions: [
        {
          name: fieldName,
          type: DataTypes.INTEGER,
        },
      ],
    });

    cy.wrap(p).then((experience: ExperienceFragment) => {
      const { id: definitionId } = experience.dataDefinitions[0];

      /**
       * When we visit new entry page
       */
      cy.visit(makeNewEntryRoute(experience.id));

      /**
       * Then we should see the title
       */
      cy.title().should("contain", `[New Entry] ${title}`);

      /**
       * When user completes and submits the form
       */
      cy.get("#" + makeFieldInputId(definitionId)).type("3");
      cy.get("#" + submitBtnDomId).click();

      /**
       * Then user should redirected to experience page
       */
      cy.title().should("not.contain", `[New Entry]`);
      cy.title().should("contain", title);

      /**
       * Then data user just created should exist on page
       */
      cy.get(makeIdAttributeSelector(experience)).then($element => {
        expect($element[0].textContent).eq("3");
      });
    });
  });

  it("creates entry for saved experience successfully when user offline", () => {
    /**
     * Given there is an online experience in the system
     */
    const fieldName = "Total purchases";

    const p = createOnlineExperience({
      title,
      dataDefinitions: [
        {
          name: fieldName,
          type: DataTypes.INTEGER,
        },
      ],
    });

    cy.wrap(p).then((experience: ExperienceFragment) => {
      const { id: definitionId } = experience.dataDefinitions[0];
      /**
       * When we visit new entry page
       */
      cy.visit(makeNewEntryRoute(experience.id));

      /**
       * Then we should see the title
       */
      cy.title().should("contain", `[New Entry] ${title}`);

      cy.setConnectionStatus(false);

      /**
       * When user completes and submits the form
       */
      cy.get("#" + makeFieldInputId(definitionId)).type("4");
      cy.get("#" + submitBtnDomId).click();

      /**
       * Then data user just created should exist on page
       */
      cy.get(makeIdAttributeSelector(experience)).then($element => {
        expect($element.text()).eq("4");
        expect($element.attr("id")).to.include(OFFLINE_ID_PREFIX);
      });
    });
  });

  it("creates entry for unsaved experience successfully when user offline", () => {
    /**
     * Given there is an unsaved experience in the system
     */
    const fieldName = "tt";

    const p = createOfflineExperience(
      {
        title,
        dataDefinitions: [
          {
            name: fieldName,
            type: DataTypes.INTEGER,
          },
        ],
      },

      { persist: true },
    );

    cy.wrap(p).then((experience: ExperienceFragment) => {
      const { id: definitionId } = experience.dataDefinitions[0];
      /**
       * When we visit new entry page
       */
      cy.visit(makeNewEntryRoute(experience.id));

      /**
       * Then we should see the title
       */
      cy.title().should("contain", `[New Entry] ${title}`);

      cy.setConnectionStatus(false);

      /**
       * When user completes and submits the form
       */
      cy.get("#" + makeFieldInputId(definitionId)).type("2");
      cy.get("#" + submitBtnDomId).click();

      /**
       * Then user should redirected to experience page
       */
      cy.title().should("not.contain", `[New Entry]`);
      cy.title().should("contain", title);

      /**
       * Then data user just created should exist on page
       */
      cy.get(makeIdAttributeSelector(experience)).then($element => {
        expect($element.text()).eq("2");
        expect($element.attr("id")).to.include(OFFLINE_ID_PREFIX);
      });
    });
  });
});

function makeIdAttributeSelector(experience: ExperienceFragment) {
  return `[id$="-${experience.dataDefinitions[0].id}-value"]`;
}

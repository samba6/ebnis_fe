/* eslint-disable @typescript-eslint/no-explicit-any */
import { USER_REGISTRATION_OBJECT } from "../support/user-registration-object";
import { DataTypes } from "../../src/graphql/apollo-types/globalTypes";
import { EXPERIENCE_DEFINITION_URL } from "../../src/routes";
import { EXPERIENCE_DEFINITION_TITLE } from "../../src/constants/experience-definition-title";
import { createOnlineExperience } from "../support/create-experience";
import {
  titleInputDomId,
  descriptionInputDomId,
  definitionNameInputDomId,
  definitionTypeInputDomId,
  submitDomId,
  notificationErrorCloseId,
  makeDefinitionContainerDomId,
  addDefinitionSelector,
} from "../../src/components/ExperienceDefinition/experience-definition.dom";
import { experienceNoEntriesDomId } from "../../src/components/Experience/experience.dom";
import { submitBtnDomId as newEntrySubmitDomId } from "../../src/components/NewEntry/new-entry.dom";
import formatDate from "date-fns/format";

context("experience definition page", () => {
  beforeEach(() => {
    cy.checkoutSession();
    cy.registerUser(USER_REGISTRATION_OBJECT);
  });

  const experienceOnlineTitle = "Experience 1";

  it.only("succeeds when online", () => {
    const p = createOnlineExperience({
      title: experienceOnlineTitle,
      dataDefinitions: [
        {
          name: "aa",
          type: DataTypes.INTEGER,
        },
      ],
    });

    cy.wrap(p).then(() => {
      /**
       * Given we are on experiences page
       */
      cy.visit(EXPERIENCE_DEFINITION_URL);

      /**
       * Then we should see the page title
       */
      cy.title().should("contain", EXPERIENCE_DEFINITION_TITLE);

      /**
       * When we complete the title field with existing experience title
       */
      cy.get("#" + titleInputDomId)
        .as("titleDomInput")
        .type(experienceOnlineTitle);

      cy.get("#" + makeDefinitionContainerDomId(1))
        .as("field1")
        .within(() => {
          /**
           * And we complete the field name and field type
           */
          cy.get("#" + definitionNameInputDomId + "1").type("field 1");
          cy.get("#" + definitionTypeInputDomId + "1").select(DataTypes.DATE);
        });

      /**
       * Then we should not see any error
       */
      cy.get("#" + notificationErrorCloseId).should("not.exist");

      /**
       * And submit the form
       */
      cy.get("#" + submitDomId).click();

      /**
       * Then we should see errors
       */
      cy.get("#" + notificationErrorCloseId).should("exist");

      /**
       * When we complete the title field with new experience title
       */
      cy.get("@titleDomInput").type("1");

      /**
       * And we complete the description field
       */
      cy.get("#" + descriptionInputDomId).type("cool exp");

      cy.get("@field1").within(() => {
        /**
         * And add one more field button is clicked
         */
        cy.get("." + addDefinitionSelector)
          .first()
          .click();
      });

      cy.get("#" + makeDefinitionContainerDomId(2)).within(() => {
        /**
         * And we complete the field name and field type
         */
        cy.get("#" + definitionNameInputDomId + "2").type("field 2");
        cy.get("#" + definitionTypeInputDomId + "2").select(DataTypes.DATETIME);

        /**
         * And add one more field button is clicked
         */
        cy.get("." + addDefinitionSelector)
          .first()
          .click();
      });

      cy.get("#" + makeDefinitionContainerDomId(3)).within(() => {
        /**
         * And we complete the field name and field type
         */
        cy.get("#" + definitionNameInputDomId + "3").type("field 3");
        cy.get("#" + definitionTypeInputDomId + "3").select(DataTypes.DECIMAL);

        /**
         * And add one more field button is clicked
         */
        cy.get("." + addDefinitionSelector)
          .first()
          .click();
      });

      cy.get("#" + makeDefinitionContainerDomId(4)).within(() => {
        /**
         * And we complete the field name and field type
         */
        cy.get("#" + definitionNameInputDomId + "4").type("field 4");
        cy.get("#" + definitionTypeInputDomId + "4").select(DataTypes.INTEGER);

        /**
         * And add one more field button is clicked
         */
        cy.get("." + addDefinitionSelector)
          .first()
          .click();
      });

      cy.get("#" + makeDefinitionContainerDomId(5)).within(() => {
        /**
         * And we complete the field name and field type
         */
        cy.get("#" + definitionNameInputDomId + "5").type("field 5");
        cy.get("#" + definitionTypeInputDomId + "5").select(
          DataTypes.MULTI_LINE_TEXT,
        );

        /**
         * And add one more field button is clicked
         */
        cy.get("." + addDefinitionSelector)
          .first()
          .click();
      });

      cy.get("#" + makeDefinitionContainerDomId(6)).within(() => {
        /**
         * And we complete the field name and field type
         */
        cy.get("#" + definitionNameInputDomId + "6").type("field 6");
        cy.get("#" + definitionTypeInputDomId + "6").select(
          DataTypes.SINGLE_LINE_TEXT,
        );
      });

      /**
       * And submit the form
       */
      cy.get("#" + submitDomId).click();

      /**
       * Then we should see the new title we just created
       */
      cy.title().should("contain", experienceOnlineTitle);

      /**
       * When link to create new entry is clicked
       */
      cy.get("#" + experienceNoEntriesDomId).click();

      const testDate = new Date("2019-05-28T07:25");
      const [y, m, d, h, mi] = formatDate(testDate, "yyyy MMM d HH mm").split(
        " ",
      );

      /**
       * And new entry is created
       */
      cy.get("#" + newEntrySubmitDomId).click();
    });
  });

  it("succeeds when offline", () => {
    /**
     * Given we are on experiences page
     */
    cy.visit(EXPERIENCE_DEFINITION_URL);

    /**
     * Then we should see the page title
     */
    cy.title().should("contain", EXPERIENCE_DEFINITION_TITLE);

    cy.setConnectionStatus(false);

    /**
     * When we complete the title field with new experience definition title
     */
    const title = "new experience title";
    cy.get("#" + titleInputDomId).type(title);

    /**
     * And we complete the description field
     */
    cy.get("#" + descriptionInputDomId).type("new experience description");

    /**
     * And we complete the field name field
     */
    cy.get("#" + definitionNameInputDomId + "1").type("experience field 1");
    cy.get("#" + definitionTypeInputDomId + "1").select(DataTypes.DATE);

    /**
     * And we click on field type
     */
    cy.get("#" + definitionTypeInputDomId + "1").select(DataTypes.DATE);

    /**
     * And submit the form
     */
    cy.get("#" + submitDomId).click();

    /**
     * Then we should see the new title we just created
     */
    cy.title().should("contain", title);
  });
});

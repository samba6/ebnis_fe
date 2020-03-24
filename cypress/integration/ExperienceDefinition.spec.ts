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
import {
  experienceNoEntriesDomId,
  experienceOptionsMenuTriggerSelector,
  newEntryTriggerSelector,
} from "../../src/components/Experience/experience.dom";
import {
  submitBtnDomId as newEntrySubmitDomId,
  NEW_ENTRY_DOCUMENT_TITLE_PREFIX,
  dateComponentDomSelector,
  datetimeComponentDomSelector,
  integerInputDomSelector,
  decimalInputDomSelector,
  singleLineInputDomSelector,
  multiLineInputDomSelector,
} from "../../src/components/NewEntry/new-entry.dom";
import {
  makeYearItemSelector,
  yearDropdownSelector,
  makeDayItemSelector,
  dayDropdownSelector,
  makeMonthItemSelector,
  monthDropdownSelector,
  makeMinuteItemSelector,
  minuteDropdownSelector,
  makeHourItemSelector,
  hourDropdownSelector,
} from "../../src/components/DateField/date-field.dom";
import formatDate from "date-fns/format";
import { entryValueDomSelector } from "../../src/components/Entry/entry.dom";
import {
  DISPLAY_TIME_FORMAT_STRING,
  DISPLAY_DATE_FORMAT_STRING,
} from "../../src/components/Experience/experience.utils";

context("experience definition page", () => {
  beforeEach(() => {
    cy.checkoutSession();
    cy.registerUser(USER_REGISTRATION_OBJECT);
  });

  const firstOnlineExperienceTitle = "Experience 1";
  const secondOnlineExperienceTitle = firstOnlineExperienceTitle + "1";

  it.only("succeeds when online", () => {
    const p = createOnlineExperience({
      title: firstOnlineExperienceTitle,
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
        .type(firstOnlineExperienceTitle);

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
      cy.title().should("contain", secondOnlineExperienceTitle);

      /**
       * When link to create new entry is clicked
       */
      cy.get("#" + experienceNoEntriesDomId).click();

      /**
       * Then page should navigate to 'new entry' page
       */
      cy.title().should("contain", NEW_ENTRY_DOCUMENT_TITLE_PREFIX);

      /**
       * When fields are completed
       */

      const lastYear = new Date().getFullYear() - 1;
      const testDate = new Date(`${lastYear}-05-28T07:25`);
      const [year, month, day, hours, minutes] = formatDate(
        testDate,
        "yyyy MMM d HH mm",
      ).split(" ");

      cy.get("." + dateComponentDomSelector)
        .first()
        .within(() => {
          cy.get("." + dayDropdownSelector)
            .first()
            .click()
            .within(() => {
              cy.get("." + makeDayItemSelector(day))
                .first()
                .click();
            });

          cy.get("." + monthDropdownSelector)
            .first()
            .click()
            .within(() => {
              cy.get("." + makeMonthItemSelector(month))
                .first()
                .click();
            });

          cy.get("." + yearDropdownSelector)
            .first()
            .click()
            .within(() => {
              cy.get("." + makeYearItemSelector(year))
                .first()
                .click();
            });
        });

      cy.get("." + datetimeComponentDomSelector)
        .first()
        .within(() => {
          cy.get("." + hourDropdownSelector)
            .first()
            .click()
            .within(() => {
              cy.get("." + makeHourItemSelector(hours))
                .first()
                .click();
            });

          cy.get("." + minuteDropdownSelector)
            .first()
            .click()
            .within(() => {
              cy.get("." + makeMinuteItemSelector(minutes))
                .first()
                .click();
            });
        });

      cy.get("." + integerInputDomSelector)
        .first()
        .type("5");

      cy.get("." + decimalInputDomSelector)
        .first()
        .type("5.5");

      cy.get("." + singleLineInputDomSelector)
        .first()
        .type("aa");

      cy.get("." + multiLineInputDomSelector)
        .first()
        .type("bb\ncc");

      /**
       * And new entry is created with updated data
       */
      cy.get("#" + newEntrySubmitDomId).click();

      /**
       * Then user should be returned to experience detail page
       */
      cy.title().should("contain", secondOnlineExperienceTitle);

      /**
       * And newly created entry data should be visible
       */
      cy.get("." + entryValueDomSelector).each((dom, index) => {
        const value = dom.text();

        switch (index) {
          case 0:
            expect(value).to.eq(
              formatDate(testDate, DISPLAY_DATE_FORMAT_STRING),
            );
            break;

          case 1:
            expect(value).to.contain(
              formatDate(testDate, DISPLAY_TIME_FORMAT_STRING),
            );
            break;

          case 2:
            expect(value).to.eq("5.5");
            break;

          case 3:
            expect(value).to.eq("5");
            break;

          case 4:
            expect(dom[0].innerText).to.eq("bb\ncc\n");
            break;

          case 5:
            expect(value).to.eq("aa");
            break;
        }
      });

      /**
       * When connection goes away
       */
      cy.setConnectionStatus(false);

      /**
       * And UI to create new entry is triggered
       */
      cy.get("." + experienceOptionsMenuTriggerSelector)
        .click()
        .within(() => {
          cy.get("." + newEntryTriggerSelector).click();
        });

      /**
       * Then page should navigate to 'new entry' page
       */
      cy.title().should("contain", NEW_ENTRY_DOCUMENT_TITLE_PREFIX);

      /**
       * And new entry is created with  default data
       */
      cy.get("#" + newEntrySubmitDomId).click();
      const today = new Date();

      /**
       * Then user should be returned to experience detail page
       */
      cy.title().should("contain", secondOnlineExperienceTitle);

      /**
       * And newly created entry data (default Values) should be visible
       */
      cy.get("." + entryValueDomSelector).each((dom, index) => {
        const value = dom.text();

        switch (index) {
          case 0:
            expect(value).to.eq(formatDate(today, DISPLAY_DATE_FORMAT_STRING));
            break;

          case 1:
            expect(value).to.contain(
              formatDate(today, DISPLAY_TIME_FORMAT_STRING),
            );
            break;

          case 2:
          case 3:
            expect(value).to.eq("0");
            break;

          case 4:
          case 5:
            expect(value).to.eq("");
            break;
        }
      });

      /**
       * When connection returns
       */
      cy.setConnectionStatus(true);
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

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
  onlineExperienceSyncedNotificationSuccessDom,
  syncButtonId,
  offlineExperienceSyncedNotificationSuccessSelector,
  deleteExperienceTriggerSelector,
  okDeleteExperienceDomId,
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
import {
  entryValueDomSelector,
  entryOptionsSelector,
  entryEditMenuItemSelector,
} from "../../src/components/Entry/entry.dom";
import {
  DISPLAY_TIME_FORMAT_STRING,
  DISPLAY_DATE_FORMAT_STRING,
} from "../../src/components/Experience/experience.utils";
import {
  editEntryComponentDomId,
  editEntrySubmissionResponseDomId,
  editEntrySubmitDomId,
} from "../../src/components/EditEntry/edit-entry-dom";
import { MY_EXPERIENCES_TITLE } from "../../src/constants/my-experiences-title";
import { makeExperienceRoute } from "../../src/constants/experience-route";
import { ExperienceFragment } from "../../src/graphql/apollo-types/ExperienceFragment";
import { PAGE_NOT_FOUND_TITLE } from "../../src/constants";

context("experience definition page", () => {
  beforeEach(() => {
    cy.checkoutSession();
    cy.registerUser(USER_REGISTRATION_OBJECT);

    cy.server();
  });

  const firstOnlineExperienceTitle = "OnExp";
  const secondOnlineExperienceTitle = firstOnlineExperienceTitle + "1";
  const offlineExperienceTitle = "OffExp";

  describe("online experience", () => {
    it("create", () => {
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
         * Given we are on experience definition page
         */
        cy.visit(EXPERIENCE_DEFINITION_URL);

        /**
         * Then we should see the page title
         */
        cy.title().should("contain", EXPERIENCE_DEFINITION_TITLE);

        ///////////////////// EXPERIENCE TITLE ERROR ///////////////////

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
            cy.get("#" + definitionNameInputDomId + "1").type("f1");
            cy.get("#" + definitionTypeInputDomId + "1").select(DataTypes.DATE);
          });

        /**
         * Then error notification should not be visible
         */
        cy.get("#" + notificationErrorCloseId).should("not.exist");

        /**
         * When form is submitted
         */
        cy.get("#" + submitDomId).click();

        /**
         * Then error notification should be visible
         */
        cy.get("#" + notificationErrorCloseId).should("exist");

        ///////////////////// CREATE EXPERIENCE ////////////////////

        /**
         * When title and description fields are completed with new data
         */
        cy.get("@titleDomInput").type("1");
        cy.get("#" + descriptionInputDomId).type("dd");

        cy.get("@field1").within(() => {
          /**
           * And add 'another field' button is clicked
           */
          cy.get("." + addDefinitionSelector)
            .first()
            .click();
        });

        /**
         * And second field is completed
         */
        cy.get("#" + makeDefinitionContainerDomId(2)).within(() => {
          /**
           * And we complete the field name and field type
           */
          cy.get("#" + definitionNameInputDomId + "2").type("f2");
          cy.get("#" + definitionTypeInputDomId + "2").select(
            DataTypes.DATETIME,
          );

          /**
           * And add one more field button is clicked
           */
          cy.get("." + addDefinitionSelector)
            .first()
            .click();
        });

        /**
         * And 3rd field is completed
         */
        cy.get("#" + makeDefinitionContainerDomId(3)).within(() => {
          /**
           * And we complete the field name and field type
           */
          cy.get("#" + definitionNameInputDomId + "3").type("f3");
          cy.get("#" + definitionTypeInputDomId + "3").select(
            DataTypes.DECIMAL,
          );

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
          cy.get("#" + definitionNameInputDomId + "4").type("f4");
          cy.get("#" + definitionTypeInputDomId + "4").select(
            DataTypes.INTEGER,
          );

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
          cy.get("#" + definitionNameInputDomId + "5").type("f5");
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
          cy.get("#" + definitionNameInputDomId + "6").type("f6");
          cy.get("#" + definitionTypeInputDomId + "6").select(
            DataTypes.SINGLE_LINE_TEXT,
          );
        });

        /**
         * And form is submitted
         */
        cy.get("#" + submitDomId).click();

        /**
         * Then we should see the new title we just created
         */
        cy.title().should("contain", secondOnlineExperienceTitle);

        ////////////////////// CREATE ONLINE ENTRY //////////////////////

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

        //////////////////// CREATE OFFLINE ENTRY /////////////////////////

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
         * When new entry is created with  default data
         */
        cy.get("#" + newEntrySubmitDomId).click();

        /**
         * Then user should be returned to experience detail page
         */
        cy.title().should("contain", secondOnlineExperienceTitle);
        const today = new Date();

        /**
         * And newly created entry data (default Values) should be visible
         */
        cy.get("." + entryValueDomSelector)
          .first()
          .each((dom, index) => {
            const value = dom.text();

            switch (index) {
              case 0:
                expect(value).to.eq(
                  formatDate(today, DISPLAY_DATE_FORMAT_STRING),
                );
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

        ////////////////////////// SYNC CHANGES //////////////////////

        /**
         * When connection returns
         */
        cy.setConnectionStatus(true);

        /**
         * Then success notification should not be visible
         */
        cy.get("." + onlineExperienceSyncedNotificationSuccessDom).should(
          "not.exist",
        );

        /**
         * When sync button is clicked
         */
        cy.get("#" + syncButtonId).click();

        /**
         * Then success notification should be visible
         */
        cy.get("." + onlineExperienceSyncedNotificationSuccessDom).should(
          "exist",
        );

        ////////////////////////// EDIT ENTRY ONLINE ////////////////////////////

        /**
         * When edit entry UI is invoked
         */
        cy.get("." + entryOptionsSelector)
          .first()
          .click()
          .within(() => {
            cy.get("." + entryEditMenuItemSelector)
              .first()
              .click();
          });

        /**
         * Then edit entry UI should be visible
         */
        cy.get("#" + editEntryComponentDomId)
          .should("exist")
          .as("editEntryComponentDom");

        /**
         * Then edit entry success response should not be visible
         */
        cy.get("#" + editEntrySubmissionResponseDomId).should("not.exist");

        cy.get("@editEntryComponentDom").within(() => {
          /**
           * When changes made to entry are submitted
           */
          cy.get("." + integerInputDomSelector)
            .should("have.value", "0")
            .type("1");

          cy.get("#" + editEntrySubmitDomId).click();
        });

        /**
         * Then edit entry success response should be visible
         */
        cy.get("#" + editEntrySubmissionResponseDomId).should("exist");

        /**
         * When edit entry UI is closed
         */
        cy.get("@editEntryComponentDom").within(() => {
          cy.get(".close.icon")
            .first()
            .click();
        });

        /**
         * Then edit entry UI should not be visible
         */
        cy.get("#" + editEntryComponentDomId).should("not.exist");

        ////////////////////////// delete ////////////////////////////
        /**
         * When UI to delete experience is triggered
         */
        cy.get("." + experienceOptionsMenuTriggerSelector)
          .click()
          .within(() => {
            cy.get("." + deleteExperienceTriggerSelector).click();
          });

        /**
         * And deletion is confirmed
         */
        cy.get("#" + okDeleteExperienceDomId).click();

        /**
         * Then user should be redirected to home page
         */
        cy.title().should("contain", MY_EXPERIENCES_TITLE);
      });
    });

    it("deletes", () => {
      const p = createOnlineExperience({
        title: firstOnlineExperienceTitle,
        dataDefinitions: [
          {
            name: "aa",
            type: DataTypes.INTEGER,
          },
        ],
      });

      cy.wrap(p).then((experience: ExperienceFragment) => {
        const url = makeExperienceRoute(experience.id);

        /**
         * Given we are on experience details page
         */
        cy.visit(url);

        /**
         * Then we should see the page title
         */
        cy.title().should("contain", firstOnlineExperienceTitle);

        /**
         * When UI to delete experience is triggered
         */
        cy.get("." + experienceOptionsMenuTriggerSelector)
          .click()
          .within(() => {
            cy.get("." + deleteExperienceTriggerSelector).click();
          });

        /**
         * And deletion is confirmed
         */
        cy.get("#" + okDeleteExperienceDomId).click();

        /**
         * Then user should be redirected to home page
         */
        cy.title().should("contain", MY_EXPERIENCES_TITLE);

        /**
         * If user attempts to visit deleted experience page
         */

        cy.visit(url);

        /**
         * Then the page should not be available
         */
        cy.title().should("contain", PAGE_NOT_FOUND_TITLE);
      });
    });
  });

  it("offline", () => {
    /**
     * Given we are on experiences page
     */
    cy.visit(EXPERIENCE_DEFINITION_URL);

    /**
     * Then we should see the page title
     */
    cy.title().should("contain", EXPERIENCE_DEFINITION_TITLE);

    cy.setConnectionStatus(false);

    ////////////////////////// CREATE OFFLINE EXPERIENCE //////////////

    /**
     * When title and description fields are completed
     */
    cy.get("#" + titleInputDomId).type(offlineExperienceTitle);
    cy.get("#" + descriptionInputDomId).type("dd");

    /**
     * And field data is completed
     */
    cy.get("#" + makeDefinitionContainerDomId(1)).within(() => {
      /**
       * And field name and field type are completed
       */
      cy.get("#" + definitionNameInputDomId + "1").type("f1");
      cy.get("#" + definitionTypeInputDomId + "1").select(DataTypes.INTEGER);
    });

    /**
     * And form is submitted
     */
    cy.get("#" + submitDomId).click();

    /**
     * Then we should see the new title we just created
     */
    cy.title().should("contain", offlineExperienceTitle);

    ////////////// CREATE OFFLINE ENTRY FOR OFFLINE EXPERIENCE ////////

    /**
     * When link to create new entry is clicked
     */
    cy.get("#" + experienceNoEntriesDomId).click();

    /**
     * Then page should navigate to 'new entry' page
     */
    cy.title().should("contain", NEW_ENTRY_DOCUMENT_TITLE_PREFIX);

    /**
     * When new entry is created with  default data
     */
    cy.get("#" + newEntrySubmitDomId).click();

    /**
     * Then user should be returned to experience detail page
     */
    cy.title().should("contain", offlineExperienceTitle);

    ////////////// OFFLINE EXPERIENCE: EDIT ENTRY ONLINE /////////

    cy.setConnectionStatus(true);

    /**
     * When edit entry UI is invoked
     */
    cy.get("." + entryOptionsSelector)
      .first()
      .click()
      .within(() => {
        cy.get("." + entryEditMenuItemSelector)
          .first()
          .click();
      });

    /**
     * Then entry UI should be visible
     * And when one of the fields is changed
     */
    cy.get("#" + editEntryComponentDomId)
      .should("exist")
      .within(() => {
        cy.get("." + integerInputDomSelector)
          .should("have.value", "0")
          .type("1");
      });

    /**
     * Then success notification should not be visible
     */
    cy.get("." + offlineExperienceSyncedNotificationSuccessSelector).should(
      "not.exist",
    );

    /**
     * When changes made to entry are submitted
     */
    cy.get("#" + editEntrySubmitDomId).click();

    /**
     * Then success notification should be visible
     */
    cy.get("." + offlineExperienceSyncedNotificationSuccessSelector).should(
      "exist",
    );
  });
});

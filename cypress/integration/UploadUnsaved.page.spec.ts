/* eslint-disable @typescript-eslint/no-explicit-any */
import { USER_REGISTRATION_OBJECT } from "../support/user-registration-object";
import { DataTypes } from "../../src/graphql/apollo-types/globalTypes";
import { makeExperienceRoute } from "../../src/constants/experience-route";
import {
  createSavedExperience,
  createOfflineExperience,
} from "../support/create-experience";
import {
  createExperienceEntries,
  createOfflineEntry,
} from "../support/create-entries";
import { PAGE_NOT_FOUND_TITLE } from "../../src/constants";
import { UPLOAD_OFFLINE_ITEMS_TITLE } from "../../src/constants/upload-offline-title";
import { persistCache } from "../support/mutate";

context("Upload offline items page", () => {
  beforeEach(() => {
    cy.checkoutSession();
    cy.registerUser(USER_REGISTRATION_OBJECT);
  });

  it("uploads offline item successfully", () => {
    const savedExperiencePromise = createSavedExperience({
      title: "saved-1",
      dataDefinitions: [
        {
          name: "f1",
          type: DataTypes.INTEGER,
        },
      ],
    }).then(experience => {
      const { id, dataDefinitions } = experience;

      const saved = createExperienceEntries([
        {
          dataObjects: [
            {
              definitionId: dataDefinitions[0].id,
              data: `{"integer":"1"}`,
            },
          ],
          experienceId: id,
          clientId: "1",
        },
      ]);

      const offlineEntry = createOfflineEntry({
        experience,
        dataObjects: [
          {
            data: `{"integer":"2"}`,
            definitionId: dataDefinitions[0].id,
          },
        ],
      });

      return Promise.all([saved, offlineEntry]).then(() => {
        return experience;
      });
    });

    const offlineExperienceTitle = "olu omo";

    const offlineExperiencePromise = createOfflineExperience({
      title: offlineExperienceTitle,
      dataDefinitions: [
        {
          name: "f2",
          type: DataTypes.INTEGER,
        },
      ],
    }).then(offlineExperience => {
      const { dataDefinitions } = offlineExperience;

      return createOfflineEntry({
        experience: offlineExperience,
        dataObjects: [
          {
            data: `{"integer":"3"}`,
            definitionId: dataDefinitions[0].id,
          },
        ],
      }).then(() => {
        return offlineExperience;
      });
    });

    let experiencesPromises = Promise.all([
      savedExperiencePromise,
      offlineExperiencePromise,
    ]).then(result => {
      return persistCache().then(() => {
        return result;
      });
    });

    cy.wrap(experiencesPromises).then(([, offlineExperience]) => {
      const { id: offlineId } = offlineExperience;
      const offlineRoute = makeExperienceRoute(offlineId);

      cy.visit(offlineRoute);

      let uploadSuccessRegexp = /^upload-triggered-icon-success-(.+?)$/;
      let savedId: string;

      cy.title().should("contain", offlineExperienceTitle);

      cy.get("#header-unsaved-count-label").click();
      cy.title().should("contain", UPLOAD_OFFLINE_ITEMS_TITLE);
      cy.get("#upload-unsaved-tab-menu-never-saved").click();
      cy.get("#upload-unsaved-upload-btn").click();

      cy.get(
        ".unsaved-experience--success .experience-title__success-icon",
      ).then($elm => {
        savedId = uploadSuccessRegexp.exec($elm.attr("id"))[1];

        cy.visit(makeExperienceRoute(savedId));
        cy.title().should("contain", offlineExperienceTitle);

        cy.visit(offlineRoute);
        cy.title().should("contain", PAGE_NOT_FOUND_TITLE);
      });
    });
  });
});

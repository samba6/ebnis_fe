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
import {
  offlineExperiencesTabMenuDomId,
  uploadBtnDomId,
  makeUploadStatusIconId,
} from "../../src/components/UploadOfflineItems/upload-offline.dom";
import { offlineItemsCountLinkId } from "../../src/components/Header/header.dom";

context("Upload offline items page", () => {
  beforeEach(() => {
    cy.checkoutSession();
    cy.registerUser(USER_REGISTRATION_OBJECT);
  });

  it("uploads offline item successfully", () => {
    const onlineExperiencePromise = createSavedExperience({
      title: "saved-1",
      dataDefinitions: [
        {
          name: "f1",
          type: DataTypes.INTEGER,
        },
      ],
    }).then(experience => {
      const { id, dataDefinitions } = experience;

      const onlineEntryPromise = createExperienceEntries([
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

      const offlineEntryPromise = createOfflineEntry({
        experienceId: experience.id,
        dataObjects: [
          {
            data: `{"integer":"2"}`,
            definitionId: dataDefinitions[0].id,
          },
        ],
      });

      return Promise.all([onlineEntryPromise, offlineEntryPromise]).then(() => {
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
        experienceId: offlineExperience.id,
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

    const experiencesPromises = Promise.all([
      onlineExperiencePromise,
      offlineExperiencePromise,
    ]).then(result => {
      return persistCache().then(() => {
        return result;
      });
    });

    cy.wrap(experiencesPromises).then(([, offlineExperience]) => {
      const { id: offlineId } = offlineExperience;
      const offlineRoute = makeExperienceRoute(offlineId);
      const successIconDomId = makeUploadStatusIconId(offlineId, "success");

      cy.visit(offlineRoute);

      cy.title().should("contain", offlineExperienceTitle);

      cy.get("#" + offlineItemsCountLinkId).click();
      cy.title().should("contain", UPLOAD_OFFLINE_ITEMS_TITLE);
      cy.get(`#${offlineExperiencesTabMenuDomId}`).click();

      /**
       * we should not see success icon
       */
      cy.get(`#${successIconDomId}`).should("not.exist");

      /**
       * When upload button is clicked
       */
      cy.get(`#${uploadBtnDomId}`).click();

      /**
       * Then we should see success icon
       */

      cy.get(`#${successIconDomId}`).then($elm => {
        /**
         * When we visit detailed page of newly online experience
         */
        cy.visit(makeExperienceRoute($elm.data("experience-id")));

        /**
         * Then we should see that it has same title as offline experience
         */
        cy.title().should("contain", offlineExperienceTitle);

        /**
         * But when we visit detailed page of offline experience
         */
        cy.visit(offlineRoute);

        /**
         * We should find that it no longer exists
         */
        cy.title().should("contain", PAGE_NOT_FOUND_TITLE);
      });
    });
  });
});

import { USER_REGISTRATION_OBJECT } from "../support/user-registration-object";
import { FieldType } from "../../src/graphql/apollo-types/globalTypes";
import { makeNewEntryRoute } from "../../src/constants/new-entry-route";

context("new experience entry page", () => {
  beforeEach(() => {
    cy.closeSession();
    cy.checkoutSession();
    cy.registerUser(USER_REGISTRATION_OBJECT);
  });

  const title = "My experience no. 1";

  it("creates entry successfully when user online", () => {
    /**
     * Given there is an experience in the system with no entries
     */
    cy.defineExperience({
      title,
      fieldDefs: [
        {
          name: "Field integer",
          type: FieldType.INTEGER
        }
      ]
    }).then(experience => {
      cy.visit(makeNewEntryRoute(experience.id));

      /**
       * Then we should see the title
       */
      cy.title().should("contain", `[New Entry] ${title}`);
    });
  });
});

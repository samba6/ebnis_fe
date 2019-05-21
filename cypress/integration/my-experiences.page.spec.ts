import { USER_REGISTRATION_OBJECT } from "../support/user-registration-object";
import { FieldType } from "../../src/graphql/apollo-types/globalTypes";
import { EXPERIENCES_URL } from "../../src/routes";
import { MY_EXPERIENCES_TITLE } from "../../src/constants";
import { getDescendantByText } from "../support/get-descendant-by-text";

const title = "My experience no. 1";

context("my experiences page", () => {
  beforeEach(() => {
    cy.checkoutSession();
    cy.registerUser(USER_REGISTRATION_OBJECT);
    cy.defineExperience({
      title,
      fieldDefs: [
        {
          name: "Field date",
          type: FieldType.DATE
        },

        {
          name: "Field datetime",
          type: FieldType.DATETIME
        },

        {
          name: "Field integer",
          type: FieldType.INTEGER
        }
      ]
    });
  });

  afterEach(() => {
    cy.closeSession();
  });

  it("creates entry successfully", () => {
    /**
     * Given we are at my experiences page
     */
    cy.visit(EXPERIENCES_URL);

    /**
     * Then we should see the title
     */
    cy.title().should("contain", MY_EXPERIENCES_TITLE);

    /**
     * When we click on the title of experience to which we want to add entry
     */
    cy.get('[data-testid="exps-container"]').then($node => {
      getDescendantByText(title, $node).click();
    });

    /**
     * Then we should be directed to the experience's detailed page
     */
    cy.title().should("contain", title);
  });
});

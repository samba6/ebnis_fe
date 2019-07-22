import { USER_CREATION_OBJECT } from "../support/user-creation-object";

context("login page", () => {
  beforeEach(() => {
    cy.checkoutSession();

    /**
     * Given we are on login page
     */

    cy.visit("/login");
  });

  it("errors if we login with non existent user", () => {
    /**
     * Then we should see the title
     */
    cy.title().should("contain", "Log in");

    /**
     * And we should not see any error
     */

    cy.get("#server-field-errors").should("not.exist");

    /**
     * When we complete and submit the form
     */
    cy.get("#email").type(USER_CREATION_OBJECT.email);
    cy.get("#login-password").type(USER_CREATION_OBJECT.password);
    cy.get("#login-submit").click();

    /**
     * The we should not see any error
     */
    cy.get("#server-field-errors").should("exist");
  });
});

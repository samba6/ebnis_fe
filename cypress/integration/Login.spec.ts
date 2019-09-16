import { USER_CREATION_OBJECT } from "../support/user-creation-object";

context("login page", () => {
  beforeEach(() => {
    cy.checkoutSession();
  });

  it("errors if we login with non existent user", () => {
    /**
     * Given we are on login page
     */

    cy.visit("/login");

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
    cy.get("#login-email").type(USER_CREATION_OBJECT.email);
    cy.get("#login-password").type(USER_CREATION_OBJECT.password);
    cy.get("#login-submit").click();

    /**
     * The we should not see any error
     */
    cy.get("#server-field-errors").should("exist");
  });



  it("logs in user successfully from index page", () => {
    /**
     * Given that a user exists in the system
     */
    cy.createUser(USER_CREATION_OBJECT);

    /**
     * And we visit the index page
     */
    cy.visit("/");

    /**
     * Then we should see the title
     */
    cy.title().should("eq", "Ebnis");

    /**
     * When we complete and submit the form
     */
    cy.get("#login-email").type(USER_CREATION_OBJECT.email);
    cy.get("#login-password").type(USER_CREATION_OBJECT.password);
    cy.get("#login-submit").click();

    /**
     * Then we should see the new title
     */
    cy.title().should("contain", "My Experiences");
  });
});

import { USER_CREATION_OBJECT } from "../support/user-creation-object";

context("login page", () => {
  beforeEach(() => {
    cy.closeSession();
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
    cy.queryByTestId("server-field-errors").should("not.exist");

    /**
     * When we complete and submit the form
     */
    cy.getByLabelText(/email/i).type(USER_CREATION_OBJECT.email);
    cy.getByLabelText(/password/i).type(USER_CREATION_OBJECT.password);
    cy.getByText(/submit/i).click();

    /**
     * The we should not see any error
     */
    cy.getByTestId("server-field-errors").should("exist");
  });
});

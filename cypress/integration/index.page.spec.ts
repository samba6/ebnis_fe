import { USER_CREATION_OBJECT } from "../support/user-creation-object";

context("index route", () => {
  beforeEach(() => {
    cy.checkoutSession();
  });

  afterEach(() => {
    cy.closeSession();
  });

  it("logs in user successfully", () => {
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
    cy.getByLabelText(/email/i).type(USER_CREATION_OBJECT.email);
    cy.getByLabelText(/password/i).type(USER_CREATION_OBJECT.password);
    cy.getByText(/submit/i).click();

    /**
     * Then we should see the new title
     */
    cy.title().should("contain", "My Experiences");
  });
});

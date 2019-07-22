import { USER_CREATION_OBJECT } from "../support/user-creation-object";

context("signup page", () => {
  beforeEach(() => {
    cy.checkoutSession();

    /**
     * Given that we are on signup page
     */
    cy.visit("/signup");
  });

  it("creates user successfully", () => {
    /**
     * Then we should see the title
     */
    cy.title().should("contain", "Sign up");

    /**
     * When we complete the form and submit
     */
    cy.get("#sign-up-name").type(USER_CREATION_OBJECT.name);
    cy.get("#sign-up-email").type(USER_CREATION_OBJECT.email);
    cy.get("#sign-up-password").type(USER_CREATION_OBJECT.password);
    cy.get("#sign-up-passwordConfirmation").type(
      USER_CREATION_OBJECT.password_confirmation,
    );
    cy.get("#sign-up-submit").click();

    /**
     * Then we should see the new title
     */
    cy.title().should("contain", "My Experiences");
  });

  it("fails to create user if user already exists", () => {
    /**
     * And there is a user in the system
     */
    cy.createUser(USER_CREATION_OBJECT);

    /**
     * Then we should not see any errors
     */
    cy.queryByTestId("server-field-error").should("not.exist");

    /**
     * When we complete the form and submit
     */
    cy.get("#sign-up-name").type(USER_CREATION_OBJECT.name);
    cy.get("#sign-up-email").type(USER_CREATION_OBJECT.email);
    cy.get("#sign-up-password").type(USER_CREATION_OBJECT.password);
    cy.get("#sign-up-passwordConfirmation").type(
      USER_CREATION_OBJECT.password_confirmation,
    );
    cy.get("#sign-up-submit").click();

    /**
     * Then we should see errors
     */
    cy.get("#server-field-error").should("exist");
  });
});

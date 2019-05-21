import { USER_CREATION_OBJECT } from "../support/user-creation-object";

context("signup page", () => {
  beforeEach(() => {
    cy.checkoutSession();

    /**
     * Given that we are on signup page
     */
    cy.visit("/signup");
  });

  afterEach(() => {
    cy.closeSession();
  });

  it("creates user successfully", () => {
    /**
     * Then we should see the title
     */
    cy.title().should("contain", "Sign up");

    /**
     * When we complete the form and submit
     */
    cy.getByLabelText("Name").type(USER_CREATION_OBJECT.name);
    cy.getByLabelText("Email").type(USER_CREATION_OBJECT.email);
    cy.getByLabelText("Password").type(USER_CREATION_OBJECT.password);
    cy.getByLabelText("Password Confirm").type(
      USER_CREATION_OBJECT.password_confirmation
    );
    cy.getByText(/submit/i).click();

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
    cy.getByLabelText("Name").type(USER_CREATION_OBJECT.name);
    cy.getByLabelText("Email").type(USER_CREATION_OBJECT.email);
    cy.getByLabelText("Password").type(USER_CREATION_OBJECT.password);
    cy.getByLabelText("Password Confirm").type(
      USER_CREATION_OBJECT.password_confirmation
    );
    cy.getByText(/submit/i).click();

    /**
     * Then we should see errors
     */
    cy.getByTestId("server-field-error").should("exist");
  });
});

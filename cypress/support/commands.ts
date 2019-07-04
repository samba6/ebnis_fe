/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-use-before-define */
import "cypress-testing-library/add-commands";
import { UserCreationObject } from "./user-creation-object";
import { Registration } from "../../src/graphql/apollo-types/globalTypes";
import {
  UserRegMutation,
  UserRegMutationVariables,
  UserRegMutation_registration,
} from "../../src/graphql/apollo-types/UserRegMutation";
import { REG_USER_MUTATION } from "../../src/graphql/user-reg.mutation";
import {
  USER_LOCAL_MUTATION,
  UserLocalMutationVariable,
} from "../../src/state/user.resolver";
import {
  ManualConnectionStatus,
  setManualConnection,
} from "../../src/test-utils/manual-connection-setting";
import { USER_JWT_ENV } from "./constants";
import { mutate, persistCache } from "./mutate";

const serverUrl = Cypress.env("API_URL") as string;

function checkoutSession() {
  cy.request("GET", serverUrl + "/reset_db").then(response => {
    expect(response.body).to.equal("ok");
  });
}

function closeSession() {
  setManualConnection(ManualConnectionStatus.unset);
}

function createUser(userData: UserCreationObject) {
  cy.request("POST", serverUrl + "/create_user", { user: userData }).then(
    response => {
      const user = response.body;
      const { jwt } = user;
      expect(jwt).to.be.a("string");
      Cypress.env(USER_JWT_ENV, jwt);
    },
  );
}

function registerUser(userData: Registration) {
  return mutate<UserRegMutation, UserRegMutationVariables>({
    mutation: REG_USER_MUTATION,
    variables: {
      registration: userData,
    },
  })
    .then(result => {
      const user =
        result &&
        result.data &&
        (result.data.registration as UserRegMutation_registration);

      const { jwt } = user;

      Cypress.env(USER_JWT_ENV, jwt);

      return mutate<UserLocalMutationVariable, UserLocalMutationVariable>({
        mutation: USER_LOCAL_MUTATION,
        variables: { user },
      });
    })
    .then(result => {
      const user =
        result &&
        result.data &&
        (result.data.user as UserRegMutation_registration);

      return user;
    });
}

function setConnectionStatus(status: ManualConnectionStatus) {
  setManualConnection(status);
}

Cypress.Commands.add("checkoutSession", checkoutSession);
Cypress.Commands.add("closeSession", closeSession);
Cypress.Commands.add("createUser", createUser);
Cypress.Commands.add("registerUser", registerUser);
Cypress.Commands.add("setConnectionStatus", setConnectionStatus);
Cypress.Commands.add("persistCache", persistCache);

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       *
       */
      checkoutSession: () => Chainable<Promise<void>>;

      /**
       *
       */
      createUser: (data: UserCreationObject) => Chainable<Promise<void>>;

      /**
       *
       */
      registerUser: (
        userData: Registration,
      ) => Promise<UserRegMutation_registration>;

      /**
       *
       */
      closeSession: () => void;

      /**
       *
       */
      setConnectionStatus: (status: ManualConnectionStatus) => void;
    }
  }
}

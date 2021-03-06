/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-use-before-define */
import { UserCreationObject } from "./user-creation-object";
import { Registration } from "../../src/graphql/apollo-types/globalTypes";
import {
  UserRegMutation,
  UserRegMutationVariables,
  UserRegMutation_registration,
} from "../../src/graphql/apollo-types/UserRegMutation";
import { REGISTER_USER_MUTATION } from "../../src/graphql/user-registration.mutation";
import { mutate } from "./mutate";
import { buildClientCache } from "../../src/state/apollo-setup";
import { allResolvers } from "../../src/state/all-resolvers";
import { UserFragment } from "../../src/graphql/apollo-types/UserFragment";
import { storeUser } from "../../src/state/users";
import { storeConnectionStatus } from "../../src/state/connections";
import { USER_REGISTRATION_OBJECT } from "./user-registration-object";

const serverUrl = Cypress.env("API_URL") as string;

function checkoutSession() {
  window.localStorage.clear();

  buildClientCache({
    uri: serverUrl,
    resolvers: allResolvers,
    newE2eTest: true,
  });

  cy.request("GET", serverUrl + "/reset_db").then(response => {
    expect(response.body).to.equal("ok");
  });
}

function createUser(userData: UserCreationObject) {
  return cy
    .request("POST", serverUrl + "/create_user", { user: userData })
    .then(response => {
      return response.body as UserFragment;
    });
}

async function registerUser(userData: Registration = USER_REGISTRATION_OBJECT) {
  return mutate<UserRegMutation, UserRegMutationVariables>({
    mutation: REGISTER_USER_MUTATION,
    variables: {
      registration: userData,
    },
  }).then(result => {
    const user =
      result &&
      result.data &&
      (result.data.registration as UserRegMutation_registration);

    storeUser(user);

    return user;
  });
}

function setConnectionStatus(isConnected: boolean) {
  storeConnectionStatus(isConnected, "manual");
}

Cypress.Commands.add("checkoutSession", checkoutSession);
Cypress.Commands.add("createUser", createUser);
Cypress.Commands.add("registerUser", registerUser);
Cypress.Commands.add("setConnectionStatus", setConnectionStatus);

declare global {
  interface Window {
    Cypress: {
      env: <T>(k?: string, v?: T) => void | T;
    };
  }

  namespace Cypress {
    interface Chainable {
      /**
       *
       */
      checkoutSession: () => Chainable<Promise<void>>;

      /**
       *
       */
      createUser: (
        data: UserCreationObject,
      ) => Chainable<Promise<UserFragment>>;

      /**
       *
       */
      registerUser: (
        userData?: Registration,
      ) => Promise<UserRegMutation_registration>;

      /**
       *
       */
      setConnectionStatus: (isConnected: boolean) => void;
    }
  }
}

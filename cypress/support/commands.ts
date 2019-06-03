// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This is will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })
import "cypress-testing-library/add-commands";
import { MutationOptions } from "apollo-client/core/watchQueryOptions";
import { USER_JWT_ENV } from "./user-jwt-env";
import { UserCreationObject } from "./user-creation-object";
import { buildClientCache } from "../../src/state/apollo-setup";
import {
  Registration,
  CreateExp,
  CreateField
} from "../../src/graphql/apollo-types/globalTypes";
import {
  UserRegMutation,
  UserRegMutationVariables,
  UserRegMutation_registration
} from "../../src/graphql/apollo-types/UserRegMutation";
import { REG_USER_MUTATION } from "../../src/graphql/user-reg.mutation";
import {
  USER_LOCAL_MUTATION,
  UserLocalMutationVariable
} from "../../src/state/user.local.mutation";
import { CREATE_EXPERIENCE_RETURN_ALL_FIELDS_MUTATION } from "../../src/graphql/create-experience-return-all-fields.mutation";
import {
  CreateExperienceExperienceReturnAllFieldsMutation,
  CreateExperienceExperienceReturnAllFieldsMutationVariables,
  CreateExperienceExperienceReturnAllFieldsMutation_exp
} from "../../src/graphql/apollo-types/CreateExperienceExperienceReturnAllFieldsMutation";
import { FetchResult } from "react-apollo";
import {
  CreateEntriesMutation,
  CreateEntriesMutationVariables,
  CreateEntriesMutation_createEntries,
  CreateEntriesMutation_createEntries_successes_entry
} from "../../src/graphql/apollo-types/CreateEntriesMutation";
import { CREATE_ENTRIES_MUTATION } from "../../src/graphql/create-entries.mutation";

const serverUrl = Cypress.env("API_URL") as string;

function checkoutSession() {
  cy.request("GET", serverUrl + "/reset_db").then(response => {
    expect(response.body).to.equal("ok");
  });
}

function closeSession() {
  Cypress.env(USER_JWT_ENV, null);

  return mutate<UserLocalMutationVariable, UserLocalMutationVariable>({
    mutation: USER_LOCAL_MUTATION,
    variables: { user: null }
  });
}

function createUser(userData: UserCreationObject) {
  cy.request("POST", serverUrl + "/create_user", { user: userData }).then(
    response => {
      const user = response.body;
      const { jwt } = user;
      expect(jwt).to.be.a("string");
      Cypress.env(USER_JWT_ENV, jwt);
    }
  );
}

function registerUser(userData: Registration) {
  return mutate<UserRegMutation, UserRegMutationVariables>({
    mutation: REG_USER_MUTATION,
    variables: {
      registration: userData
    }
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
        variables: { user }
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

function defineExperience(experienceDefinitionArgs: CreateExp) {
  return mutate<
    CreateExperienceExperienceReturnAllFieldsMutation,
    CreateExperienceExperienceReturnAllFieldsMutationVariables
  >({
    mutation: CREATE_EXPERIENCE_RETURN_ALL_FIELDS_MUTATION,
    variables: {
      exp: experienceDefinitionArgs
    }
  }).then(result => {
    const exp =
      result &&
      result.data &&
      (result.data
        .exp as CreateExperienceExperienceReturnAllFieldsMutation_exp);

    return exp;
  });
}

function createExperienceEntries(
  experience: CreateExperienceExperienceReturnAllFieldsMutation_exp,
  createEntriesArgs: CreateField[][]
) {
  return mutate<CreateEntriesMutation, CreateEntriesMutationVariables>({
    mutation: CREATE_ENTRIES_MUTATION,
    variables: {
      createEntries: {
        expId: experience.id,
        listOfFields: createEntriesArgs
      }
    }
  }).then(result => {
    const { successes } = (result &&
      result.data &&
      result.data.createEntries) as CreateEntriesMutation_createEntries;

    return [
      experience,
      successes.sort((a, b) => a.index - b.index).map(a => a.entry)
    ];
  });
}

function mutate<TData, TVariables>(
  options: MutationOptions<TData, TVariables>
) {
  const { client } = buildClientCache({
    uri: serverUrl,
    headers: {
      jwt: Cypress.env(USER_JWT_ENV)
    },
    forceSocketConnection: true
  });

  return client.mutate<TData, TVariables>(options);
}

Cypress.Commands.add("checkoutSession", checkoutSession);
Cypress.Commands.add("closeSession", closeSession);
Cypress.Commands.add("createUser", createUser);
Cypress.Commands.add("registerUser", registerUser);
Cypress.Commands.add("mutate", mutate);
Cypress.Commands.add("defineExperience", defineExperience);
Cypress.Commands.add("createExperienceEntries", createExperienceEntries);

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
      mutate: <TData, TVariables>(
        options: MutationOptions<TData, TVariables>
      ) => Promise<
        // tslint:disable-next-line: no-any
        FetchResult<TData, Record<string, any>, Record<string, any>>
      >;

      /**
       *
       */
      registerUser: (
        userData: Registration
      ) => Promise<UserRegMutation_registration>;

      /**
       *
       */
      closeSession: () => void;

      /**
       *
       */
      defineExperience: (
        experienceDefinitionArgs: CreateExp
      ) => Promise<CreateExperienceExperienceReturnAllFieldsMutation_exp>;

      /**
       *
       */
      createExperienceEntries: (
        experience: CreateExperienceExperienceReturnAllFieldsMutation_exp,
        createEntriesArgs: CreateField[][]
      ) => Promise<
        [
          CreateExperienceExperienceReturnAllFieldsMutation_exp,
          CreateEntriesMutation_createEntries_successes_entry[]
        ]
      >;
    }
  }
}

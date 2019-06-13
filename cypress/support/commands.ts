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
import { UserCreationObject } from "./user-creation-object";
import { buildClientCache, makePersistor } from "../../src/state/apollo-setup";
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
} from "../../src/state/user.resolver";
import { CREATE_EXPERIENCE_RETURN_ALL_FIELDS_MUTATION } from "../../src/graphql/create-experience-return-all-fields.mutation";
import {
  CreateExperienceReturnAllFieldsMutation,
  CreateExperienceReturnAllFieldsMutationVariables,
  CreateExperienceReturnAllFieldsMutation_exp
} from "../../src/graphql/apollo-types/CreateExperienceReturnAllFieldsMutation";
import { FetchResult } from "react-apollo";
import {
  CreateEntriesMutation,
  CreateEntriesMutationVariables,
  CreateEntriesMutation_createEntries,
  CreateEntriesMutation_createEntries_successes_entry
} from "../../src/graphql/apollo-types/CreateEntriesMutation";
import { CREATE_ENTRIES_MUTATION } from "../../src/graphql/create-entries.mutation";
import {
  ManualConnectionStatus,
  setManualConnection
} from "../../src/test-utils/manual-connection-setting";
import {
  CreateUnsavedExperienceMutationData,
  CREATE_UNSAVED_EXPERIENCE_MUTATION,
  experienceDefinitionResolvers
} from "../../src/components/ExperienceDefinition/resolvers";
import { UnsavedExperience } from "../../src/components/ExperienceDefinition/resolver-utils";
import { CACHE_ENV_NAME, USER_JWT_ENV } from "./constants";
import {
  SCHEMA_VERSION,
  SCHEMA_VERSION_KEY
} from "../../src/constants/apollo-schema";

const serverUrl = Cypress.env("API_URL") as string;

function checkoutSession() {
  cy.request("GET", serverUrl + "/reset_db").then(response => {
    expect(response.body).to.equal("ok");
  });
}

function closeSession() {
  setManualConnection(ManualConnectionStatus.unset);
  Cypress.env(USER_JWT_ENV, null);
  Cypress.env(CACHE_ENV_NAME, null);
  localStorage.removeItem(SCHEMA_VERSION_KEY);

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

function defineOnlineExperience(experienceDefinitionArgs: CreateExp) {
  return mutate<
    CreateExperienceReturnAllFieldsMutation,
    CreateExperienceReturnAllFieldsMutationVariables
  >({
    mutation: CREATE_EXPERIENCE_RETURN_ALL_FIELDS_MUTATION,
    variables: {
      exp: experienceDefinitionArgs
    }
  }).then(result => {
    const exp =
      result &&
      result.data &&
      (result.data.exp as CreateExperienceReturnAllFieldsMutation_exp);

    return exp;
  });
}

function defineUnsavedExperience(experienceDefinitionArgs: CreateExp) {
  return mutate<
    CreateUnsavedExperienceMutationData,
    CreateExperienceReturnAllFieldsMutationVariables
  >({
    mutation: CREATE_UNSAVED_EXPERIENCE_MUTATION,
    variables: {
      exp: experienceDefinitionArgs
    }
  }).then(result => {
    const exp =
      result &&
      result.data &&
      (result.data.createUnsavedExperience as UnsavedExperience);

    return exp;
  });
}

function createExperienceEntries(
  experience: CreateExperienceReturnAllFieldsMutation_exp,
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
  const { client, cache } = buildClientCache({
    uri: serverUrl,
    headers: {
      jwt: Cypress.env(USER_JWT_ENV)
    },
    isE2e: true,
    resolvers: [experienceDefinitionResolvers]
  });

  Cypress.env(CACHE_ENV_NAME, cache);

  return client.mutate<TData, TVariables>(options);
}

function setConnectionStatus(status: ManualConnectionStatus) {
  setManualConnection(status);
}

async function persistCache() {
  const cache = Cypress.env(CACHE_ENV_NAME);

  if (!cache) {
    return false;
  }

  localStorage.setItem(SCHEMA_VERSION_KEY, SCHEMA_VERSION);

  const persistor = makePersistor(cache);

  await persistor.persist();

  return true;
}

Cypress.Commands.add("checkoutSession", checkoutSession);
Cypress.Commands.add("closeSession", closeSession);
Cypress.Commands.add("createUser", createUser);
Cypress.Commands.add("registerUser", registerUser);
Cypress.Commands.add("mutate", mutate);
Cypress.Commands.add("defineOnlineExperience", defineOnlineExperience);
Cypress.Commands.add("defineUnsavedExperience", defineUnsavedExperience);
Cypress.Commands.add("createExperienceEntries", createExperienceEntries);
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
      defineOnlineExperience: (
        experienceDefinitionArgs: CreateExp
      ) => Promise<CreateExperienceReturnAllFieldsMutation_exp>;

      defineUnsavedExperience: (
        experienceDefinitionArgs: CreateExp
      ) => Promise<UnsavedExperience>;

      /**
       *
       */
      createExperienceEntries: (
        experience: CreateExperienceReturnAllFieldsMutation_exp,
        createEntriesArgs: CreateField[][]
      ) => Promise<
        [
          CreateExperienceReturnAllFieldsMutation_exp,
          CreateEntriesMutation_createEntries_successes_entry[]
        ]
      >;

      /**
       *
       */
      setConnectionStatus: (status: ManualConnectionStatus) => void;

      /**
       *
       */
      persistCache: () => Promise<boolean>;
    }
  }
}

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
import {
  buildClientCache,
  E2EWindowObject
} from "../../src/state/apollo-setup";
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
  CREATE_UNSAVED_EXPERIENCE_MUTATION
} from "../../src/components/ExperienceDefinition/resolvers";
import { UnsavedExperience } from "../../src/components/ExperienceDefinition/resolver-utils";
import { USER_JWT_ENV } from "./constants";
import {
  SCHEMA_VERSION,
  SCHEMA_VERSION_KEY
} from "../../src/constants/apollo-schema";
import ApolloClient from "apollo-client";
import { NormalizedCacheObject } from "apollo-cache-inmemory";
import { CachePersistor } from "apollo-cache-persist";
import { allResolvers } from "../../src/state/all-resolvers";
import {
  CreateExpMutation,
  CreateExpMutationVariables,
  CreateExpMutation_exp
} from "../../src/graphql/apollo-types/CreateExpMutation";
import { EXP_MUTATION } from "../../src/graphql/create-exp.mutation";

const serverUrl = Cypress.env("API_URL") as string;
// let cache: InMemoryCache;
let client: ApolloClient<{}>;
let persistor: CachePersistor<NormalizedCacheObject>;
const emptyE2eWindowObject = {} as E2EWindowObject;

function checkoutSession() {
  cy.request("GET", serverUrl + "/reset_db").then(response => {
    expect(response.body).to.equal("ok");
  });
}

function closeSession() {
  window.___e2e = null;
  client = null;
  persistor = null;
  setManualConnection(ManualConnectionStatus.unset);
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
  return mutate<CreateExpMutation, CreateExpMutationVariables>({
    mutation: EXP_MUTATION,
    variables: {
      exp: experienceDefinitionArgs
    }
  }).then(result => {
    const exp =
      result && result.data && (result.data.exp as CreateExpMutation_exp);

    expect(exp.id).to.be.a("string");

    return exp;
  });
}

function defineUnsavedExperience(experienceDefinitionArgs: CreateExp) {
  return mutate<
    CreateUnsavedExperienceMutationData,
    CreateExpMutationVariables
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

    expect(exp.id).to.be.a("string");

    return exp;
  });
}

function createExperienceEntries(
  experience: CreateExpMutation_exp,
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
  return cy.window().then(win => {
    const e2eWindowObject = win.___e2e || emptyE2eWindowObject;
    const windowClient = e2eWindowObject.client;

    /**
     * When the browser starts loading frontend code, the frontend code will
     * attach its apollo client, cache and persistor to the window object.
     * We will then use the client and persistor from the frontend code so
     * that we can send command from here to affect the operation of the
     * frontend.
     */
    if (windowClient && client !== windowClient) {
      // we need to add all resolvers because resolvers are loaded per page on
      // frontend while here we may need resolvers for a page that has not
      // loaded.
      windowClient.addResolvers(allResolvers);
      client = windowClient;
      persistor = e2eWindowObject.persistor;
    }

    if (!client) {
      const apolloSetup = buildClientCache({
        uri: serverUrl,
        headers: {
          jwt: Cypress.env(USER_JWT_ENV)
        },
        isE2e: true
      });

      client = apolloSetup.client;
      client.addResolvers(allResolvers);
      persistor = apolloSetup.persistor;
    }

    return client.mutate<TData, TVariables>(options);
  });
}

function setConnectionStatus(status: ManualConnectionStatus) {
  setManualConnection(status);
}

async function persistCache() {
  if (!persistor) {
    return false;
  }

  localStorage.setItem(SCHEMA_VERSION_KEY, SCHEMA_VERSION);

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
      ) => Promise<CreateExpMutation_exp>;

      defineUnsavedExperience: (
        experienceDefinitionArgs: CreateExp
      ) => Promise<UnsavedExperience>;

      /**
       *
       */
      createExperienceEntries: (
        experience: CreateExpMutation_exp,
        createEntriesArgs: CreateField[][]
      ) => Promise<
        [
          CreateExpMutation_exp,
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

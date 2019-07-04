/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-use-before-define */
import "cypress-testing-library/add-commands";
import { MutationOptions } from "apollo-client/core/watchQueryOptions";
import { UserCreationObject } from "./user-creation-object";
import {
  buildClientCache,
  E2EWindowObject,
} from "../../src/state/apollo-setup";
import {
  Registration,
  CreateEntryInput,
  CreateExperienceInput,
} from "../../src/graphql/apollo-types/globalTypes";
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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { FetchResult } from "react-apollo";
import {
  CreateEntriesMutation,
  CreateEntriesMutationVariables,
  CreateEntriesMutation_createEntries_entries,
} from "../../src/graphql/apollo-types/CreateEntriesMutation";
import { CREATE_ENTRIES_MUTATION } from "../../src/graphql/create-entries.mutation";
import {
  ManualConnectionStatus,
  setManualConnection,
} from "../../src/test-utils/manual-connection-setting";
import {
  CreateUnsavedExperienceMutationData,
  CREATE_UNSAVED_EXPERIENCE_MUTATION,
} from "../../src/components/ExperienceDefinition/resolvers";
import { USER_JWT_ENV } from "./constants";
import {
  SCHEMA_VERSION,
  SCHEMA_VERSION_KEY,
} from "../../src/constants/apollo-schema";
import ApolloClient from "apollo-client";
import { NormalizedCacheObject } from "apollo-cache-inmemory";
import { CachePersistor } from "apollo-cache-persist";
import { allResolvers } from "../../src/state/all-resolvers";
import {
  CreateExperienceMutation,
  CreateExperienceMutationVariables,
  CreateExperienceMutation_createExperience,
} from "../../src/graphql/apollo-types/CreateExperienceMutation";
import { CREATE_EXPERIENCE_MUTATION } from "../../src/graphql/create-experience.mutation";
import { ExperienceFragment } from "../../src/graphql/apollo-types/ExperienceFragment";

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

function defineOnlineExperience(
  experienceDefinitionArgs: CreateExperienceInput,
) {
  return mutate<CreateExperienceMutation, CreateExperienceMutationVariables>({
    mutation: CREATE_EXPERIENCE_MUTATION,
    variables: {
      createExperienceInput: experienceDefinitionArgs,
    },
  }).then(result => {
    const exp =
      result &&
      result.data &&
      (result.data
        .createExperience as CreateExperienceMutation_createExperience);

    expect(exp.id).to.be.a("string");

    return exp;
  });
}

function defineUnsavedExperience(
  experienceDefinitionArgs: CreateExperienceInput,
) {
  return mutate<
    CreateUnsavedExperienceMutationData,
    CreateExperienceMutationVariables
  >({
    mutation: CREATE_UNSAVED_EXPERIENCE_MUTATION,
    variables: {
      createExperienceInput: experienceDefinitionArgs,
    },
  }).then(result => {
    const experience =
      result &&
      result.data &&
      (result.data.createUnsavedExperience as ExperienceFragment);

    expect(experience.id).to.be.a("string");

    return cy.persistCache().then(isPersisted => {
      expect(isPersisted).to.eq(true);

      return experience;
    });
  });
}

function createExperienceEntries(
  experienceId: string,
  createEntries: CreateEntryInput[],
) {
  return mutate<CreateEntriesMutation, CreateEntriesMutationVariables>({
    mutation: CREATE_ENTRIES_MUTATION,
    variables: {
      createEntries,
    },
  }).then(result => {
    const data = result && result.data && result.data.createEntries;

    const entries = data.reduce(
      (acc, obj) => {
        return acc.concat(obj.entries);
      },
      [] as CreateEntriesMutation_createEntries_entries[],
    );

    return entries;
  });
}

function mutate<TData, TVariables>(
  options: MutationOptions<TData, TVariables>,
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
          jwt: Cypress.env(USER_JWT_ENV),
        },
        isE2e: true,
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
        options: MutationOptions<TData, TVariables>,
      ) => Promise<
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        FetchResult<TData, Record<string, any>, Record<string, any>>
      >;

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
      defineOnlineExperience: (
        experienceDefinitionArgs: CreateExperienceInput,
      ) => Promise<CreateExperienceMutation_createExperience>;

      defineUnsavedExperience: (
        experienceDefinitionArgs: CreateExperienceInput,
      ) => Promise<ExperienceFragment>;

      /**
       *
       */
      createExperienceEntries: (
        experienceId: string,
        createEntries: CreateEntryInput[],
      ) => Promise<CreateEntriesMutation_createEntries_entries[]>;

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

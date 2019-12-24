import {
  GetOfflineItemsSummary,
  SavedAndUnsavedExperienceSummary,
} from "../../state/offline-resolvers";
import immer, { Draft } from "immer";
import { Reducer } from "react";
import { RouteComponentProps } from "@reach/router";
import {
  ExperienceFragment_dataDefinitions,
  ExperienceFragment,
  ExperienceFragment_entries_edges_node,
  ExperienceFragment_entries_edges,
} from "../../graphql/apollo-types/ExperienceFragment";
import {
  UploadOfflineItemsMutation,
  UploadAllUnsavedsMutation_saveOfflineExperiences,
  UploadAllUnsavedsMutation_createEntries,
} from "../../graphql/apollo-types/UploadOfflineItemsMutation";
import ApolloClient, { ApolloError } from "apollo-client";
import { Dispatch } from "react";
import {
  CreateEntriesErrorsFragment,
  CreateEntriesErrorsFragment_errors,
} from "../../graphql/apollo-types/CreateEntriesErrorsFragment";
import { LayoutDispatchType } from "../Layout/layout.utils";
import { InMemoryCache } from "apollo-cache-inmemory";
import { EntryFragment } from "../../graphql/apollo-types/EntryFragment";
import { DataDefinitionFragment } from "../../graphql/apollo-types/DataDefinitionFragment";
import { DataObjectFragment } from "../../graphql/apollo-types/DataObjectFragment";
import { wrapReducer } from "../../logger";

const initialStates = {
  upload: {
    value: "idle",
  },

  dataLoaded: {
    value: "no",
  },

  tabs: {
    value: "none",
    context: {},
  },
};

const initialContext = {
  allCount: null,
};

const initial = {
  parallel: true,
  states: initialStates,
  context: initialContext,
};

export function stateInitializerFn(getOfflineItems?: GetOfflineItemsSummary) {
  if (!getOfflineItems) {
    return {
      ...initial,
      neverSavedMap: {},
      partlySavedMap: {},
    } as StateMachine;
  }

  const { partlySavedCount = 0, neverSavedCount = 0 } = getOfflineItems;

  const allCount = partlySavedCount + neverSavedCount;

  const context = {
    ...initialContext,
    allCount,
  };

  const tabsState = { ...initialStates.tabs } as TabsState;

  if (allCount > 0) {
    updateTabsState(tabsState, partlySavedCount, neverSavedCount);
  }

  const states = {
    ...initialStates,

    dataLoaded: {
      value: "yes",
    },

    tabs: tabsState,
  };

  return {
    ...{ ...initial, states, context },
    ...getOfflineItems,

    partlySavedCount,
    neverSavedCount,
  } as StateMachine;
}

function updateTabsState(
  tabsState: TabsState,
  partlySavedCount: number,
  neverSavedCount: number,
) {
  const context = { ...tabsState.context } as TabStateContext;

  if (partlySavedCount > 0 && neverSavedCount > 0) {
    context.neverSaved = true;
    context.partlySaved = true;
    tabsState.value = "two";
    const twoTabs = (tabsState as unknown) as TabTwo;

    twoTabs.states = {
      two: {
        value: "partlySaved",
      },
    };
  } else {
    tabsState.value = "one";
    context.partlySaved = partlySavedCount > 0;
    context.neverSaved = neverSavedCount > 0;
  }

  tabsState.context = context;
}

export enum ActionType {
  UPLOAD_STARTED = "@upload-unsaved/upload-started",
  UPLOAD_RESULTS_RECEIVED = "@upload-unsaved/upload-results-received",
  SERVER_ERROR = "@upload-unsaved/set-server-error",
  CLEAR_SERVER_ERRORS = "@upload-unsaved/clear-server-errors",
  INIT_STATE_FROM_PROPS = "@upload-unsaved/init-state-from-props",
  DELETE_EXPERIENCE = "@upload-unsaved/delete-experience",
  TOGGLE_TAB = "@upload-unsaved/toggle-tab",
}

export const reducer: Reducer<StateMachine, Action> = (state, action) =>
  wrapReducer(
    state,
    action,
    (prevState, { type, ...payload }) => {
      if (type === ActionType.UPLOAD_RESULTS_RECEIVED) {
        return (payload as OnUploadResultPayload).stateMachine;
      }

      return immer(prevState, proxy => {
        switch (type) {
          case ActionType.INIT_STATE_FROM_PROPS:
            {
              Object.entries(
                stateInitializerFn(
                  (payload as InitStateFromPropsPayload).getOfflineItems,
                ),
              ).forEach(([k, v]) => {
                proxy[k] = v;
              });
            }

            break;

          case ActionType.UPLOAD_STARTED:
            {
              proxy.states.upload.value = "uploading";
            }

            break;

          case ActionType.TOGGLE_TAB:
            {
              const twoTabs = (proxy.states.tabs as TabTwo).states.two;

              twoTabs.value =
                (payload as TabStateTogglePayload).currentValue ===
                "partlySaved"
                  ? "neverSaved"
                  : "partlySaved";
            }

            break;

          case ActionType.SERVER_ERROR:
            {
              const upload = proxy.states.upload as UploadedState;
              upload.value = "uploaded";

              const uploaded = (upload.uploaded ||
                {}) as UploadedState["uploaded"];

              uploaded.parallel = true;
              const uploadedStates = uploaded.states || {};

              uploadedStates.experiences =
                uploadedStates.experiences || ({} as ExperiencesUploadedState);

              uploadedStates.experiences.value = "serverError";

              const errors = (payload as { errors: ApolloError }).errors
                .message;

              const apolloErrors = (uploadedStates.apolloErrors ||
                {}) as ApolloErrorsActive;

              apolloErrors.value = "active";
              apolloErrors.active = {
                context: {
                  errors,
                },
              };

              uploadedStates.apolloErrors = apolloErrors;
              uploaded.states = uploadedStates;
              upload.uploaded = uploaded;
            }

            break;

          case ActionType.CLEAR_SERVER_ERRORS:
            {
              ((proxy.states.upload as UploadedState).uploaded.states
                .apolloErrors as ApolloErrorsInActive).value = "inactive";
            }

            break;

          case ActionType.DELETE_EXPERIENCE:
            {
              const { id, mode } = payload as DeleteActionPayload;
              const {
                context,
                states: { tabs },
              } = proxy;

              if (mode === "unsaved") {
                delete proxy.neverSavedMap[id];
                --proxy.neverSavedCount;
              } else {
                delete proxy.partlySavedMap[id];
                --proxy.partlySavedCount;
              }

              const count = proxy.neverSavedCount + proxy.partlySavedCount;
              context.allCount = count;

              if (count === 0) {
                tabs.value = "none";
                proxy.shouldRedirect = true;
              } else {
                updateTabsState(
                  tabs,
                  proxy.partlySavedCount,
                  proxy.neverSavedCount,
                );
              }
            }

            break;
        }
      });
    },
    //    true,
  );

export function definitionToUnsavedData(
  value: ExperienceFragment_dataDefinitions | null,
) {
  const { clientId, name, type } = value as ExperienceFragment_dataDefinitions;

  return { clientId, name, type };
}

function entriesErrorsToMap(errors: CreateEntriesErrorsFragment[]) {
  return errors.reduce(
    (acc, { errors, clientId }) => {
      acc[clientId] = errors;

      return acc;
    },

    {} as { [K: string]: CreateEntriesErrorsFragment_errors },
  );
}

function updatePartlySavedFromUploadResults(
  stateProxy: Draft<StateMachine>,
  createEntries: (UploadAllUnsavedsMutation_createEntries | null)[] | null,
  successState: ExperiencesUploadedResultState,
) {
  if (!createEntries) {
    return;
  }

  const localState = successState as PartialUploadSuccessState;
  let hasSuccess = false;
  let hasError = false;
  const { partlySavedMap } = stateProxy;

  localState.partial = localState.partial || {
    states: {},
  };

  const context = (localState as ExperiencesUploadedResultState).context;

  createEntries.forEach(element => {
    localState.value = "partial";

    if (!element) {
      hasError = true;
      return;
    }

    const { errors, experienceId, entries = [] } = element;
    hasSuccess = entries.length > 0;

    const map = partlySavedMap[experienceId];
    map.newlySavedEntries = entries as ExperienceFragment_entries_edges_node[];

    map.offlineEntries = replacePartlyUnsavedEntriesWithNewlySaved(
      map.offlineEntries,
      map.newlySavedEntries,
    );

    if (errors) {
      hasError = true;
      map.didUploadSucceed = false;

      map.entriesErrors = entriesErrorsToMap(
        errors as CreateEntriesErrorsFragment[],
      );
    } else {
      map.didUploadSucceed = true;
    }
  });

  if (hasSuccess) {
    context.anySuccess = true;
  }

  if (!hasSuccess) {
    localState.partial.states.saved = {
      value: "allError",
    };
  } else if (hasError) {
    localState.partial.states.saved = {
      value: "partialSuccess",
    };
  } else {
    localState.partial.states.saved = {
      value: "allSuccess",
    };
  }
}

function updateNeverSavedFromUploadResults(
  stateProxy: Draft<StateMachine>,
  uploadResults:
    | (UploadAllUnsavedsMutation_saveOfflineExperiences | null)[]
    | null,
  successState: ExperiencesUploadedResultState,
) {
  if (!uploadResults) {
    return;
  }

  const { neverSavedMap } = stateProxy;
  let hasSuccess = false;
  let hasError = false;
  const localState = successState as PartialUploadSuccessState;

  localState.partial = localState.partial || {
    states: {},
  };

  const context = (localState as ExperiencesUploadedResultState).context;

  uploadResults.forEach(elm => {
    localState.value = "partial";

    if (!elm) {
      hasError = true;
      return;
    }

    const { experience, entriesErrors, experienceErrors } = elm;

    let map = {} as ExperiencesIdsToObjectMap["k"];

    if (experienceErrors) {
      map = neverSavedMap[experienceErrors.clientId as string];
      map.experienceError = Object.entries(experienceErrors.errors).reduce(
        (acc, [k, v]) => {
          if (v && k !== "__typename") {
            acc += `\n${k}: ${v}`;
          }

          return acc;
        },
        "",
      );
    }

    if (experience) {
      hasSuccess = true;
      const { clientId } = experience;
      map = neverSavedMap[clientId as string];
      map.newlySavedExperience = experience;

      map.offlineEntries = replaceNeverSavedEntriesWithNewlySaved(
        map.offlineEntries,
        experience,
      );

      if (entriesErrors) {
        map.entriesErrors = entriesErrorsToMap(
          entriesErrors as CreateEntriesErrorsFragment[],
        );
      }
    }

    if (experienceErrors || entriesErrors) {
      map.didUploadSucceed = false;
      hasError = true;
    } else {
      map.didUploadSucceed = true;
    }
  });

  if (hasSuccess) {
    context.anySuccess = true;
  }

  if (!hasSuccess) {
    localState.partial.states.unsaved = {
      value: "allError",
    };
  } else if (hasError) {
    localState.partial.states.unsaved = {
      value: "partialSuccess",
    };
  } else {
    localState.partial.states.unsaved = {
      value: "allSuccess",
    };
  }
}

function replacePartlyUnsavedEntriesWithNewlySaved(
  offlineEntries: EntryFragment[],
  newlySavedEntries: EntryFragment[],
) {
  if (newlySavedEntries.length === 0) {
    return offlineEntries;
  }

  const newlySavedEntriesMap = newlySavedEntries.reduce(
    (acc, item) => {
      acc[item.clientId as string] = item;
      return acc;
    },
    {} as { [k: string]: EntryFragment },
  );

  return offlineEntries.map(entry => {
    const saved = newlySavedEntriesMap[entry.clientId as string];

    if (saved) {
      return saved;
    }

    return entry;
  });
}

function replaceNeverSavedEntriesWithNewlySaved(
  offlineEntries: EntryFragment[],
  newlySavedExperience: ExperienceFragment,
) {
  const savedEntries = (newlySavedExperience.entries.edges || []).map(
    edge =>
      (edge as ExperienceFragment_entries_edges)
        .node as ExperienceFragment_entries_edges_node,
  );

  const savedEntriesMap = savedEntries.reduce(
    (acc, item) => {
      acc[item.clientId as string] = item;
      return acc;
    },
    {} as { [k: string]: EntryFragment },
  );

  const newlySavedDefinitionsClientIdsMap = newlySavedExperience.dataDefinitions.reduce(
    (acc, elm) => {
      const { clientId, id } = elm as DataDefinitionFragment;

      acc[clientId as string] = id;

      return acc;
    },
    {} as { [k: string]: string },
  );

  return offlineEntries.map(unsavedEntry => {
    const saved = savedEntriesMap[unsavedEntry.clientId as string];

    if (saved) {
      return saved;
    }

    unsavedEntry.dataObjects = mapUnsavedDataObjectsDefinitionIdsToSaved(
      unsavedEntry.dataObjects as DataObjectFragment[],
      newlySavedDefinitionsClientIdsMap,
    );

    return unsavedEntry;
  });
}

function mapUnsavedDataObjectsDefinitionIdsToSaved(
  unsavedDataObjects: DataObjectFragment[],
  newlySavedDefinitionClientIdMap: { [k: string]: string },
) {
  return unsavedDataObjects.map(unsavedDataObject => {
    const newlySavedDefinitionId =
      newlySavedDefinitionClientIdMap[unsavedDataObject.definitionId];

    if (newlySavedDefinitionId) {
      unsavedDataObject.definitionId = newlySavedDefinitionId;
    }

    return unsavedDataObject;
  });
}

export function onUploadResultsReceived(
  prevState: StateMachine,
  payload: UploadOfflineItemsMutation | undefined | void,
) {
  return immer(prevState, proxy => {
    if (!payload) {
      return;
    }

    const upload = proxy.states.upload as UploadedState;
    upload.value = "uploaded";
    const uploaded = upload.uploaded || ({} as UploadedState["uploaded"]);
    uploaded.parallel = true;

    const uploadedStates = (uploaded.states ||
      {}) as UploadedState["uploaded"]["states"];

    uploadedStates.experiences = (uploadedStates.experiences || {
      value: "initial",
    }) as ExperiencesUploadedResultState;

    uploadedStates.experiences.context = uploadedStates.experiences.context || {
      anySuccess: false,
    };

    const { saveOfflineExperiences, createEntries } = payload;

    updateNeverSavedFromUploadResults(
      proxy,
      saveOfflineExperiences,
      uploadedStates.experiences,
    );

    updatePartlySavedFromUploadResults(
      proxy,
      createEntries,
      uploadedStates.experiences,
    );

    const experiences = uploadedStates.experiences;

    if (experiences.value === "partial") {
      const {
        states: { unsaved, saved },
      } = experiences.partial;

      let savedAllSuccess = false;
      let unsavedAllSuccess = false;

      if (!saved) {
        savedAllSuccess = true;
      } else {
        savedAllSuccess = saved.value === "allSuccess";
      }

      if (!unsaved) {
        unsavedAllSuccess = true;
      } else {
        unsavedAllSuccess = unsaved.value === "allSuccess";
      }

      if (savedAllSuccess && unsavedAllSuccess) {
        uploadedStates.experiences.value = "allSuccess";
      }
    }

    uploaded.states = uploadedStates;
    upload.uploaded = uploaded;
  });
}

export interface ExperiencesIdsToObjectMap {
  [k: string]: ExperienceObjectMap;
}

export interface ExperienceObjectMap extends SavedAndUnsavedExperienceSummary {
  didUploadSucceed?: boolean;
  experienceError?: string;
  entriesErrors?: {
    [K: string]: CreateEntriesErrorsFragment_errors;
  };
  newlySavedExperience?: ExperienceFragment;
  newlySavedEntries?: ExperienceFragment_entries_edges_node[];
}

export interface UploadResultPayloadThirdArg {
  cache: InMemoryCache;
  client: ApolloClient<{}>;
  layoutDispatch: LayoutDispatchType;
  result: UploadOfflineItemsMutation | undefined | void;
}

interface DeleteActionPayload {
  id: string;
  mode: SaveStatusType;
}

export type SaveStatusType = "saved" | "unsaved";

export type Props = RouteComponentProps;

export interface StateMachine {
  readonly partlySavedCount: number;
  readonly neverSavedCount: number;
  readonly partlySavedMap: ExperiencesIdsToObjectMap;
  readonly neverSavedMap: ExperiencesIdsToObjectMap;
  readonly shouldRedirect?: boolean;

  readonly parallel: true;
  readonly states: {
    readonly upload: UploadState;
    readonly tabs: TabsState;

    readonly dataLoaded: {
      value: "yes" | "no";
    };
  };

  readonly context: {
    allCount: null | number;
  };
}

export type TabsState = {
  context: TabStateContext;
} & (
  | {
      value: "none";
    }
  | {
      value: "one";
    }
  | TabTwo);

interface TabTwo {
  value: "two";

  states: {
    two: {
      value: "partlySaved" | "neverSaved";
    };
  };
}

interface TabStateContext {
  partlySaved?: boolean;
  neverSaved?: boolean;
}

interface TabStateTogglePayload {
  currentValue: TabTwo["states"]["two"]["value"];
}

type UploadState =
  | {
      value: "idle";
    }
  | {
      value: "uploading";
    }
  | UploadedState;

interface UploadedState {
  value: "uploaded";

  uploaded: {
    parallel: true;
    states: {
      experiences?: ExperiencesUploadedState;
      apolloErrors?: ApolloErrorsState;
    };
  };
}

type ApolloErrorsState = ApolloErrorsInActive | ApolloErrorsActive;

interface ApolloErrorsInActive {
  value: "inactive";
}

interface ApolloErrorsActive {
  value: "active";

  active: {
    context: {
      errors: string;
    };
  };
}

export type ExperiencesUploadedState =
  | {
      value: "serverError";
    }
  | ExperiencesUploadedResultState;

export type ExperiencesUploadedResultState = {
  context: {
    anySuccess: boolean;
  };
} & (
  | {
      value: "initial";
    }
  | {
      value: "allSuccess";
    }
  | PartialUploadSuccessState);

export interface PartialUploadSuccessState {
  value: "partial";

  partial: {
    parallel: true;

    states: {
      saved?: {
        value: "allSuccess" | "allError" | "partialSuccess";
      };

      unsaved?: {
        value: "allSuccess" | "allError" | "partialSuccess";
      };
    };
  };
}

type Action =
  | ({
      type: ActionType.UPLOAD_STARTED;
    } & UploadingPayload)
  | ({
      type: ActionType.UPLOAD_RESULTS_RECEIVED;
    } & OnUploadResultPayload)
  | {
      type: ActionType.SERVER_ERROR;
      errors: ApolloError;
    }
  | {
      type: ActionType.CLEAR_SERVER_ERRORS;
    }
  | ({
      type: ActionType.INIT_STATE_FROM_PROPS;
    } & InitStateFromPropsPayload)
  | ({
      type: ActionType.DELETE_EXPERIENCE;
    } & DeleteActionPayload)
  | ({
      type: ActionType.TOGGLE_TAB;
    } & TabStateTogglePayload);

interface UploadingPayload {
  isUploading: boolean;
}

interface OnUploadResultPayload {
  stateMachine: StateMachine;
}

interface ToggleTabPayload {
  tabNumber: number | string;
}

interface InitStateFromPropsPayload {
  getOfflineItems: GetOfflineItemsSummary;
}
export type DispatchType = Dispatch<Action>;

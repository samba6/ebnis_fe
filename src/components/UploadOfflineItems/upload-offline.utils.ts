import {
  GetOfflineItemsSummary,
  OfflineItemsSummary,
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
  UploadOfflineItemsMutation_saveOfflineExperiences,
  UploadOfflineItemsMutation_createEntries,
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

export const StateValue = {
  uploaded: "uploaded" as UploadedVal,
  no: "no" as NoVal,
  yes: "yes" as YesVal,
  one: "one" as OneVal,
  two: "two" as TwoVal,
  none: "none" as NoneVal,
  active: "active" as ActiveVal,
  inactive: "inactive" as InactiveVal,
  idle: "idle" as IdleVal,
  online: "online" as OnlineVal,
  offline: "offline" as OfflineVal,
  uploading: "uploading" as UploadedVal,
  serverError: "serverError" as ServerErrorVal,
  partial: "partial" as PartialVal,
  allError: "allError" as AllErrorVal,
  allSuccess: "allSuccess" as AllSuccessVal,
  partialSuccess: "partialSuccess" as PartialSuccessVal,
  initial: "initial" as InitialVal,
};

const INITIAL_STATES = {
  upload: {
    value: StateValue.idle,
  },
  dataLoaded: {
    value: StateValue.no,
  },
  tabs: {
    value: StateValue.none,
    context: {},
  },
};

const INITIAL_CONTEXT = {
  allCount: null,
  partlyOfflineCount: 0,
  completelyOfflineCount: 0,
};

export function initState(
  getOfflineItems?: GetOfflineItemsSummary,
): StateMachine {
  if (!getOfflineItems) {
    return {
      states: INITIAL_STATES,
      context: {
        ...INITIAL_CONTEXT,
        completelyOfflineMap: {},
        partialOnlineMap: {},
      },
    } as StateMachine;
  }

  const {
    partlyOfflineCount = 0,
    completelyOfflineCount = 0,
  } = getOfflineItems;

  const allCount = partlyOfflineCount + completelyOfflineCount;

  const context = {
    ...INITIAL_CONTEXT,
    allCount,
    ...getOfflineItems,
  };

  const tabsState = { ...INITIAL_STATES.tabs } as TabsState;

  if (allCount > 0) {
    updateTabsState(tabsState, partlyOfflineCount, completelyOfflineCount);
  }

  const states = {
    ...INITIAL_STATES,
    dataLoaded: {
      value: StateValue.yes,
    },
    tabs: tabsState,
  };

  return {
    states,
    context,
  };
}

function updateTabsState(
  tabsState: TabsState,
  partlyOfflineCount: number,
  completelyOfflineCount: number,
) {
  const context = { ...tabsState.context } as TabStateContext;

  if (partlyOfflineCount > 0 && completelyOfflineCount > 0) {
    context.offline = true;
    context.online = true;
    tabsState.value = StateValue.two;
    const twoTabs = (tabsState as unknown) as TabTwo;

    twoTabs.states = {
      two: {
        value: StateValue.online,
      },
    };
  } else {
    tabsState.value = StateValue.one;
    context.online = partlyOfflineCount > 0;
    context.offline = completelyOfflineCount > 0;
  }

  tabsState.context = context;
}

export enum ActionType {
  UPLOAD_STARTED = "@upload-offline/upload-started",
  UPLOAD_RESULTS_RECEIVED = "@upload-offline/upload-results-received",
  SERVER_ERROR = "@upload-offline/set-server-error",
  CLEAR_SERVER_ERRORS = "@upload-offline/clear-server-errors",
  INIT_STATE_FROM_PROPS = "@upload-offline/init-state-from-props",
  DELETE_EXPERIENCE = "@upload-offline/delete-experience",
  TOGGLE_TAB = "@upload-offline/toggle-tab",
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
            handleInitStateAction(proxy, payload as InitStateFromPropsPayload);
            break;

          case ActionType.UPLOAD_STARTED:
            proxy.states.upload.value = StateValue.uploading;
            break;

          case ActionType.TOGGLE_TAB:
            handleUploadStartedAction(proxy, payload as TabStateTogglePayload);
            break;

          case ActionType.SERVER_ERROR:
            handleServerErrorAction(proxy, payload as ServerErrorPayload);
            break;

          case ActionType.CLEAR_SERVER_ERRORS:
            ((proxy.states.upload as UploadedState).uploaded.states
              .apolloErrors as ApolloErrorsInActive).value =
              StateValue.inactive;
            break;

          case ActionType.DELETE_EXPERIENCE:
            handleDeleteExperienceAction(proxy, payload as DeleteActionPayload);
            break;
        }
      });
    },
    // true,
  );

////////////////////////// STATE UPDATE SECTION ///////////////////////

function handleInitStateAction(
  proxy: DraftState,
  payload: InitStateFromPropsPayload,
) {
  Object.entries(
    initState((payload as InitStateFromPropsPayload).getOfflineItems),
  ).forEach(([k, v]) => {
    proxy[k] = v;
  });
}

function handleUploadStartedAction(
  proxy: DraftState,
  payload: TabStateTogglePayload,
) {
  const twoTabs = (proxy.states.tabs as TabTwo).states.two;

  twoTabs.value =
    payload.currentValue === StateValue.online
      ? StateValue.offline
      : StateValue.online;
}

function handleServerErrorAction(
  proxy: DraftState,
  payload: ServerErrorPayload,
) {
  const upload = proxy.states.upload as UploadedState;
  upload.value = StateValue.uploaded;

  const uploaded = (upload.uploaded || {}) as UploadedState["uploaded"];
  const uploadedStates = uploaded.states || {};

  uploadedStates.experiences =
    uploadedStates.experiences || ({} as ExperiencesUploadedState);

  uploadedStates.experiences.value = StateValue.serverError;

  const errors = payload.errors.message;

  const apolloErrors = (uploadedStates.apolloErrors ||
    {}) as ApolloErrorsActive;

  apolloErrors.value = StateValue.active;
  apolloErrors.active = {
    context: {
      errors,
    },
  };

  uploadedStates.apolloErrors = apolloErrors;
  uploaded.states = uploadedStates;
  upload.uploaded = uploaded;
}

function handleDeleteExperienceAction(
  proxy: DraftState,
  payload: DeleteActionPayload,
) {
  const { id, mode } = payload;
  const {
    context,
    states: { tabs },
  } = proxy;

  if (mode === StateValue.offline) {
    delete context.completelyOfflineMap[id];
    --context.completelyOfflineCount;
  } else {
    delete context.partialOnlineMap[id];
    --context.partlyOfflineCount;
  }

  const count = context.completelyOfflineCount + context.partlyOfflineCount;
  context.allCount = count;

  if (count === 0) {
    tabs.value = StateValue.none;
    context.shouldRedirect = true;
  } else {
    updateTabsState(
      tabs,
      context.partlyOfflineCount,
      context.completelyOfflineCount,
    );
  }
}

////////////////////////// END STATE UPDATE SECTION ///////////////////////

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

function updatePartialOnlineFromUploadResults(
  proxy: DraftState,
  createEntries: (UploadOfflineItemsMutation_createEntries | null)[] | null,
  successState: ExperiencesUploadedResultState,
) {
  if (!createEntries) {
    return;
  }

  const localState = successState as PartialUploadSuccessState;
  let hasSuccess = false;
  let hasError = false;
  const { partialOnlineMap } = proxy.context;

  localState.partial =
    localState.partial ||
    ({
      states: {},
    } as PartialUploadSuccessState[PartialVal]);

  const context = (localState as ExperiencesUploadedResultState).context;

  createEntries.forEach(element => {
    localState.value = StateValue.partial;

    if (!element) {
      hasError = true;
      return;
    }

    const { errors, experienceId, entries = [] } = element;
    hasSuccess = entries.length > 0;

    const map = partialOnlineMap[experienceId];
    map.newlyOnlineEntries = entries as ExperienceFragment_entries_edges_node[];

    map.offlineEntries = replacePartlyUnsavedEntriesWithNewlySaved(
      map.offlineEntries,
      map.newlyOnlineEntries,
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
      value: StateValue.allError,
    };
  } else if (hasError) {
    localState.partial.states.saved = {
      value: StateValue.partialSuccess,
    };
  } else {
    localState.partial.states.saved = {
      value: StateValue.allSuccess,
    };
  }
}

function updateCompleteOfflineFromUploadResults(
  proxy: DraftState,
  uploadResults:
    | (UploadOfflineItemsMutation_saveOfflineExperiences | null)[]
    | null,
  successState: ExperiencesUploadedResultState,
) {
  if (!uploadResults) {
    return;
  }

  const { completelyOfflineMap } = proxy.context;
  let hasSuccess = false;
  let hasError = false;
  const localState = successState as PartialUploadSuccessState;

  localState.partial =
    localState.partial ||
    ({
      states: {},
    } as PartialUploadSuccessState[PartialVal]);

  const context = (localState as ExperiencesUploadedResultState).context;

  uploadResults.forEach(elm => {
    localState.value = StateValue.partial;

    if (!elm) {
      hasError = true;
      return;
    }

    const { experience, entriesErrors, experienceErrors } = elm;

    let map = {} as ExperiencesIdsToObjectMap["k"];

    if (experienceErrors) {
      map = completelyOfflineMap[experienceErrors.clientId as string];
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
      map = completelyOfflineMap[clientId as string];
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
    localState.partial.states.offline = {
      value: StateValue.allError,
    };
  } else if (hasError) {
    localState.partial.states.offline = {
      value: StateValue.partialSuccess,
    };
  } else {
    localState.partial.states.offline = {
      value: StateValue.allSuccess,
    };
  }
}

function replacePartlyUnsavedEntriesWithNewlySaved(
  offlineEntries: EntryFragment[],
  newlyOnlineEntries: EntryFragment[],
) {
  if (newlyOnlineEntries.length === 0) {
    return offlineEntries;
  }

  const newlySavedEntriesMap = newlyOnlineEntries.reduce((acc, item) => {
    acc[item.clientId as string] = item;
    return acc;
  }, {} as { [k: string]: EntryFragment });

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

  const savedEntriesMap = savedEntries.reduce((acc, item) => {
    acc[item.clientId as string] = item;
    return acc;
  }, {} as { [k: string]: EntryFragment });

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
    upload.value = StateValue.uploaded;
    const uploaded = upload.uploaded || ({} as UploadedState[UploadedVal]);

    const uploadedStates = (uploaded.states ||
      {}) as UploadedState[UploadedVal]["states"];

    uploadedStates.experiences = (uploadedStates.experiences || {
      value: StateValue.initial,
    }) as ExperiencesUploadedResultState;

    uploadedStates.experiences.context = uploadedStates.experiences.context || {
      anySuccess: false,
    };

    const { saveOfflineExperiences, createEntries } = payload;

    updateCompleteOfflineFromUploadResults(
      proxy,
      saveOfflineExperiences,
      uploadedStates.experiences,
    );

    updatePartialOnlineFromUploadResults(
      proxy,
      createEntries,
      uploadedStates.experiences,
    );

    const experiences = uploadedStates.experiences;

    if (experiences.value === StateValue.partial) {
      const {
        states: { offline, saved },
      } = experiences.partial;

      let savedAllSuccess = false;
      let unsavedAllSuccess = false;

      if (!saved) {
        savedAllSuccess = true;
      } else {
        savedAllSuccess = saved.value === StateValue.allSuccess;
      }

      if (!offline) {
        unsavedAllSuccess = true;
      } else {
        unsavedAllSuccess = offline.value === StateValue.allSuccess;
      }

      if (savedAllSuccess && unsavedAllSuccess) {
        uploadedStates.experiences.value = StateValue.allSuccess;
      }
    }

    uploaded.states = uploadedStates;
    upload.uploaded = uploaded;
  });
}

export interface ExperiencesIdsToObjectMap {
  [k: string]: ExperienceObjectMap;
}

export interface ExperienceObjectMap extends OfflineItemsSummary {
  didUploadSucceed?: boolean;
  experienceError?: string;
  entriesErrors?: {
    [K: string]: CreateEntriesErrorsFragment_errors;
  };
  newlySavedExperience?: ExperienceFragment;
  newlyOnlineEntries?: ExperienceFragment_entries_edges_node[];
}

export interface UploadResultPayloadThirdArg {
  cache: InMemoryCache;
  client: ApolloClient<{}>;
  layoutDispatch: LayoutDispatchType;
  result: UploadOfflineItemsMutation | undefined | void;
}

interface DeleteActionPayload {
  id: string;
  mode: OnlineVal | OfflineVal;
}

export type Props = RouteComponentProps;

type DraftState = Draft<StateMachine>;

export interface StateMachine {
  readonly states: {
    readonly upload: UploadState;
    readonly tabs: TabsState;
    readonly dataLoaded: {
      value: YesVal | NoVal;
    };
  };
  readonly context: {
    readonly allCount: null | number;
    readonly partlyOfflineCount: number;
    readonly completelyOfflineCount: number;
    readonly partialOnlineMap: ExperiencesIdsToObjectMap;
    readonly completelyOfflineMap: ExperiencesIdsToObjectMap;
    readonly shouldRedirect?: boolean;
  };
}

export type TabsState = {
  context: TabStateContext;
} & (
  | {
      value: NoneVal;
    }
  | {
      value: OneVal;
    }
  | TabTwo
);

interface TabTwo {
  value: TwoVal;
  states: {
    two: {
      value: OfflineVal | OnlineVal;
    };
  };
}

interface TabStateContext {
  online?: boolean;
  offline?: boolean;
}

interface TabStateTogglePayload {
  currentValue: TabTwo["states"][TwoVal]["value"];
}

type UploadState =
  | {
      value: IdleVal;
    }
  | {
      value: UploadingVal;
    }
  | UploadedState;

interface UploadedState {
  value: UploadedVal;
  uploaded: {
    states: {
      experiences?: ExperiencesUploadedState;
      apolloErrors?: ApolloErrorsState;
    };
  };
}

////////////////////////// STRING TYPES SECTION ////////////////////////////
type YesVal = "yes";
type NoVal = "no";
type UploadedVal = "uploaded";
type OneVal = "one";
type TwoVal = "two";
type NoneVal = "none";
type ActiveVal = "active";
type PartialVal = "partial";
type ServerErrorVal = "serverError";
type InactiveVal = "inactive";
type IdleVal = "idle";
type OnlineVal = "online";
type OfflineVal = "offline";
type UploadingVal = "uploading";
type AllErrorVal = "allError";
type AllSuccessVal = "allSuccess";
type PartialSuccessVal = "partialSuccess";
type InitialVal = "initial";
export type CreationMode = OnlineVal | OfflineVal;
////////////////////////// END STRING TYPES SECTION ///////////////////////

type ApolloErrorsState = ApolloErrorsInActive | ApolloErrorsActive;

interface ApolloErrorsInActive {
  value: InactiveVal;
}

interface ApolloErrorsActive {
  value: ActiveVal;
  active: {
    context: {
      errors: string;
    };
  };
}

export type ExperiencesUploadedState =
  | {
      value: ServerErrorVal;
    }
  | ExperiencesUploadedResultState;

export type ExperiencesUploadedResultState = {
  context: {
    anySuccess: boolean;
  };
} & (
  | {
      value: InitialVal;
    }
  | {
      value: AllSuccessVal;
    }
  | PartialUploadSuccessState
);

export interface PartialUploadSuccessState {
  value: PartialVal;
  partial: {
    states: {
      saved?: {
        value: AllSuccessVal | AllErrorVal | PartialSuccessVal;
      };
      offline?: {
        value: AllSuccessVal | AllErrorVal | PartialSuccessVal;
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

interface ServerErrorPayload {
  errors: ApolloError;
}

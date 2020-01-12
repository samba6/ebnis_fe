import {
  GetOfflineItemsSummary,
  OfflineItemsSummary,
  UseGetAllOfflineItemsProps,
} from "./upload-offline.resolvers";
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
  UploadOfflineItemsMutationVariables,
} from "../../graphql/apollo-types/UploadOfflineItemsMutation";
import ApolloClient, { ApolloError } from "apollo-client";
import { Dispatch } from "react";
import {
  CreateEntriesErrorsFragment,
  CreateEntriesErrorsFragment_errors,
} from "../../graphql/apollo-types/CreateEntriesErrorsFragment";
import { LayoutDispatchType, LayoutActionType } from "../Layout/layout.utils";
import { InMemoryCache } from "apollo-cache-inmemory";
import { EntryFragment } from "../../graphql/apollo-types/EntryFragment";
import { DataDefinitionFragment } from "../../graphql/apollo-types/DataDefinitionFragment";
import { DataObjectFragment } from "../../graphql/apollo-types/DataObjectFragment";
import { wrapReducer } from "../../logger";
import { UseCreateEntriesMutationProps } from "../../graphql/create-entries.mutation";
import { EbnisContextProps } from "../../context";
import {
  UseUploadOfflineItemsMutationProps,
  UseUploadOfflineExperiencesMutationProps,
} from "../../graphql/upload-offline-items.mutation";
import { scrollIntoView } from "../scroll-into-view";
import { updateCache } from "./update-cache";
import { CreateEntriesInput } from "../../graphql/apollo-types/globalTypes";
import { replaceExperiencesInGetExperiencesMiniQuery } from "../../state/resolvers/update-get-experiences-mini-query";
import { wipeReferencesFromCache } from "../../state/resolvers/delete-references-from-cache";
import { purgeIdsFromOfflineItemsLedger } from "../../apollo-cache/delete-experiences-ids-from-offline-items";
import { makeApolloCacheRef } from "../../constants";
import { EXPERIENCE_TYPE_NAME, ENTRY_TYPE_NAME } from "../../graphql/types";

export const StateValue = {
  submitting: "submitting" as SubmittingVal,
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

export enum ActionType {
  ON_UPLOAD = "@upload-offline/on-upload",
  ON_UPLOAD_SUCCESS = "@upload-offline/upload-results-received",
  SERVER_ERROR = "@upload-offline/set-server-error",
  CLEAR_SERVER_ERRORS = "@upload-offline/clear-server-errors",
  ON_DATA_LOADED = "@upload-offline/on-data-loaded",
  DELETE_EXPERIENCE_SUCCESS = "@upload-offline/delete-experience",
  ON_DELETE_EXPERIENCE = "@upload-offline/on-delete-experience",
  TOGGLE_TAB = "@upload-offline/toggle-tab",
  ON_SUBMIT = "@upload-offline/on-submit",
}

export const reducer: Reducer<StateMachine, Action> = (state, action) =>
  wrapReducer(
    state,
    action,
    (prevState, { type, ...payload }) => {
      return immer(prevState, proxy => {
        proxy.effects.general.value = StateValue.none;

        switch (type) {
          case ActionType.ON_UPLOAD_SUCCESS:
            handleOnUploadSuccessAction(
              proxy,
              (payload as SubmitResultPayload).results,
            );
            break;

          case ActionType.ON_DATA_LOADED:
            handleDataloadedAction(proxy, payload as DataLoadedPayload);
            break;

          case ActionType.ON_UPLOAD:
            handleOnUploadAction(proxy);
            break;

          case ActionType.TOGGLE_TAB:
            handleToggleTabAction(proxy, payload as TabStateTogglePayload);
            break;

          case ActionType.SERVER_ERROR:
            handleServerErrorAction(proxy, payload as ServerErrorPayload);
            break;

          case ActionType.CLEAR_SERVER_ERRORS:
            ((proxy.states.upload as UploadedState).uploaded.states
              .apolloErrors as ApolloErrorsInActive).value =
              StateValue.inactive;
            break;

          case ActionType.DELETE_EXPERIENCE_SUCCESS:
            handleDeleteExperienceSuccessAction(
              proxy,
              payload as DeleteActionPayload,
            );
            break;

          case ActionType.ON_DELETE_EXPERIENCE:
            handleOnDeleteExperienceAction(
              proxy,
              payload as OnDeleteExperiencePayload,
            );
            break;
        }
      });
    },
    // true,
  );

////////////////////////// EFFECTS SECTION ////////////////////////////

const deleteExperienceEffect: DeleteExperienceEffect["func"] = async (
  { mode, experienceId, offlineEntries },
  { client, cache },
  { dispatch },
) => {
  await replaceExperiencesInGetExperiencesMiniQuery(client, {
    [experienceId]: null,
  });

  purgeIdsFromOfflineItemsLedger(cache, [experienceId]);

  wipeReferencesFromCache(
    cache,
    [makeApolloCacheRef(EXPERIENCE_TYPE_NAME, experienceId)].concat(
      offlineEntries.map(e =>
        makeApolloCacheRef(ENTRY_TYPE_NAME, e.clientId as string),
      ),
    ),
  );

  dispatch({
    type: ActionType.DELETE_EXPERIENCE_SUCCESS,
    id: experienceId,
    mode,
  });
};

type DeleteExperienceEffect = EffectDefinition<OnDeleteExperiencePayload>;

const submitEffect: SubmitEffect["func"] = async (
  {
    completelyOfflineCount,
    partlyOfflineCount,
    completelyOfflineMap,
    partialOnlineMap,
  },
  { uploadAllOfflineItems, createEntries, uploadOfflineExperiences },
  { dispatch },
) => {
  try {
    let uploadFunction;
    let variables;

    if (completelyOfflineCount !== 0 && partlyOfflineCount !== 0) {
      uploadFunction = uploadAllOfflineItems;

      variables = {
        offlineExperiencesInput: offlineExperiencesToUploadData(
          completelyOfflineMap,
        ),

        offlineEntriesInput: partOfflineExperiencesToUploadData(
          partialOnlineMap,
        ),
      };
    } else if (completelyOfflineCount !== 0) {
      uploadFunction = uploadOfflineExperiences;

      variables = ({
        input: offlineExperiencesToUploadData(completelyOfflineMap),
      } as unknown) as UploadOfflineItemsMutationVariables;
    } else {
      uploadFunction = createEntries;

      variables = ({
        input: partOfflineExperiencesToUploadData(partialOnlineMap),
      } as unknown) as UploadOfflineItemsMutationVariables;
    }

    const result = await (uploadFunction as ComponentProps["uploadAllOfflineItems"])(
      {
        variables,
      },
    );

    const validResult = result && result.data;

    if (validResult) {
      dispatch({
        type: ActionType.ON_UPLOAD_SUCCESS,
        results: validResult,
      });
    }
  } catch (errors) {
    dispatch({
      type: ActionType.SERVER_ERROR,
      errors,
    });

    scrollIntoView("js-scroll-into-view-server-error");
  }
};

type SubmitEffect = EffectDefinition<StateMachine["context"]>;

const updateCacheEffect: UpdateCacheEffect["func"] = async (
  { partialOnlineMap, completelyOfflineMap },
  { persistor, layoutDispatch, cache, client },
) => {
  updateCache({
    partialOnlineMap,
    completelyOfflineMap,
    cache,
    client,
  });

  await persistor.persist();

  layoutDispatch({
    type: LayoutActionType.REFETCH_OFFLINE_ITEMS_COUNT,
  });
};

type UpdateCacheEffect = EffectDefinition<StateMachine["context"]>;

function partOfflineExperiencesToUploadData(
  experiencesIdsToObjectMap: ExperiencesIdsToObjectMap,
) {
  return Object.entries(experiencesIdsToObjectMap).reduce(
    (acc, [, { offlineEntries }]) => {
      return acc.concat(offlineEntries.map(toUploadableEntry));
    },
    [] as CreateEntriesInput[],
  );
}

function offlineExperiencesToUploadData(
  experiencesIdsToObjectMap: ExperiencesIdsToObjectMap,
) {
  return Object.values(experiencesIdsToObjectMap).map(
    ({ experience, offlineEntries }) => {
      return {
        entries: offlineEntries.map(toUploadableEntry),
        title: experience.title,
        clientId: experience.clientId,
        dataDefinitions: experience.dataDefinitions.map(definitionToUploadData),
        insertedAt: experience.insertedAt,
        updatedAt: experience.updatedAt,
        description: experience.description,
      };
    },
  );
}

const UploadableDataObjectKeys: (keyof DataObjectFragment)[] = [
  "data",
  "definitionId",
  "clientId",
  "insertedAt",
  "updatedAt",
];

function toUploadableEntry(entry: ExperienceFragment_entries_edges_node) {
  const dataObjects = entry.dataObjects.map(value => {
    const dataObject = value as DataObjectFragment;

    return UploadableDataObjectKeys.reduce((acc, k) => {
      acc[k as keyof DataObjectFragment] =
        dataObject[k as keyof DataObjectFragment];
      return acc;
    }, {} as DataObjectFragment);
  });

  return {
    experienceId: entry.experienceId,
    clientId: entry.clientId as string,
    dataObjects,
    insertedAt: entry.insertedAt,
    updatedAt: entry.updatedAt,
  };
}

export const effectFunctions = {
  submit: submitEffect,
  updateCache: updateCacheEffect,
  deleteExperience: deleteExperienceEffect,
};

function prepareGeneralEffects(proxy: DraftState) {
  const generalEffects = proxy.effects.general as GeneralEffect;
  generalEffects.value = StateValue.yes;
  const effects: EffectsList = [];
  generalEffects.yes = {
    effects,
  };
  return effects;
}

////////////////////////// END EFFECTS SECTION ////////////////////////////

////////////////////////// STATE UPDATE SECTION ///////////////////////

export function initState(
  allOfflineItems?: GetOfflineItemsSummary,
): StateMachine {
  const {
    partlyOfflineCount = 0,
    completelyOfflineCount = 0,
    completelyOfflineMap = {},
    partialOnlineMap = {},
  } = allOfflineItems || ({} as GetOfflineItemsSummary);

  const allCount = partlyOfflineCount + completelyOfflineCount;

  return {
    states: {
      upload: {
        value: StateValue.idle,
      },
      dataLoaded: {
        value: allOfflineItems ? StateValue.yes : StateValue.no,
      },
      submit: { value: StateValue.inactive },
      tabs: initTabsState(partlyOfflineCount, completelyOfflineCount),
    },
    context: {
      completelyOfflineMap,
      partialOnlineMap,
      completelyOfflineCount,
      partlyOfflineCount,
      allCount,
    },
    effects: {
      general: {
        value: StateValue.none,
      },
    },
  };
}

function initTabsState(
  partlyOfflineCount: number,
  completelyOfflineCount: number,
) {
  const tabs = {
    value: StateValue.none,
    context: {} as TabStateContext,
  };

  const context = {} as TabStateContext;
  tabs.context = context;

  if (partlyOfflineCount + completelyOfflineCount === 0) {
    return tabs;
  }

  if (partlyOfflineCount > 0 && completelyOfflineCount > 0) {
    const twoTabs = (tabs as unknown) as TabTwo;
    context.offline = true;
    context.online = true;
    twoTabs.value = StateValue.two;

    twoTabs.states = {
      two: {
        value: StateValue.online,
      },
    };
  } else {
    ((tabs as unknown) as TabOne).value = StateValue.one;
    context.online = partlyOfflineCount > 0;
    context.offline = completelyOfflineCount > 0;
  }

  return tabs;
}

function handleDataloadedAction(
  proxy: DraftState,
  { allOfflineItems }: DataLoadedPayload,
) {
  const { partlyOfflineCount, completelyOfflineCount } = allOfflineItems;

  proxy.context = {
    ...allOfflineItems,
    allCount: completelyOfflineCount + partlyOfflineCount,
  };
  const { states } = proxy;
  states.dataLoaded.value = StateValue.yes;
  states.tabs = initTabsState(partlyOfflineCount, completelyOfflineCount);
}

function handleOnUploadAction(proxy: DraftState) {
  proxy.states.upload.value = StateValue.uploading;
  const effects = prepareGeneralEffects(proxy);
  effects.push({
    key: "submit",
    ownArgs: proxy.context,
  });
}

function handleToggleTabAction(
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

function handleDeleteExperienceSuccessAction(
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
    proxy.states.tabs = initTabsState(
      context.partlyOfflineCount,
      context.completelyOfflineCount,
    );
  }
}

function handleOnDeleteExperienceAction(
  proxy: StateMachine,
  payload: OnDeleteExperiencePayload,
) {
  const effects = prepareGeneralEffects(proxy);

  effects.push({
    key: "deleteExperience",
    ownArgs: payload,
  });
}

export function handleOnUploadSuccessAction(
  proxy: DraftState,
  results: UploadOfflineItemsMutation,
) {
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

  const { saveOfflineExperiences, createEntries } = results;

  handleOfflineExperienceUploadResults(
    proxy,
    saveOfflineExperiences,
    uploadedStates.experiences,
  );

  handlePartOfflineExperiencesUploadResults(
    proxy,
    createEntries,
    uploadedStates.experiences,
  );

  const experiences = uploadedStates.experiences;

  if (experiences.value === StateValue.partial) {
    const {
      states: { offline, saved },
    } = experiences.partial;

    let allPartOfflineNowOnline = false;
    let allOfflineNowOnline = false;

    if (!saved) {
      allPartOfflineNowOnline = true;
    } else {
      allPartOfflineNowOnline = saved.value === StateValue.allSuccess;
    }

    if (!offline) {
      allOfflineNowOnline = true;
    } else {
      allOfflineNowOnline = offline.value === StateValue.allSuccess;
    }

    if (allPartOfflineNowOnline && allOfflineNowOnline) {
      uploadedStates.experiences.value = StateValue.allSuccess;
    }
  }

  uploaded.states = uploadedStates;
  upload.uploaded = uploaded;

  if (experiences.context.anySuccess) {
    const effects = prepareGeneralEffects(proxy);
    effects.push({
      key: "updateCache",
      ownArgs: proxy.context,
    });
  }
}

////////////////////////// END STATE UPDATE SECTION ///////////////////////

export function definitionToUploadData(
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

function handlePartOfflineExperiencesUploadResults(
  proxy: DraftState,
  createEntries: (UploadOfflineItemsMutation_createEntries | null)[] | null,
  state: ExperiencesUploadedResultState,
) {
  if (!createEntries) {
    return;
  }

  const localState = state as PartialUploadSuccessState;
  let hasSuccess = false;
  let hasError = false;
  const { partialOnlineMap } = proxy.context;

  localState.partial =
    localState.partial ||
    ({
      states: {},
    } as PartialUploadSuccessState[PartialVal]);

  const context = (localState as ExperiencesUploadedResultState).context;

  createEntries.forEach(result => {
    localState.value = StateValue.partial;

    if (!result) {
      hasError = true;
      return;
    }

    const { errors, experienceId, entries = [] } = result;
    hasSuccess = entries.length > 0;

    const map = partialOnlineMap[experienceId];
    map.newlyOnlineEntries = entries as ExperienceFragment_entries_edges_node[];

    map.offlineEntries = partOfflineExperienceEntriesReplaceOfflineWithNewOnline(
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

function handleOfflineExperienceUploadResults(
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

  uploadResults.forEach(uploadResult => {
    localState.value = StateValue.partial;

    if (!uploadResult) {
      hasError = true;
      return;
    }

    const { experience, entriesErrors, experienceErrors } = uploadResult;

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

      map.offlineEntries = replaceOfflineExperienceEntriesOfflineWithNewOnline(
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

function partOfflineExperienceEntriesReplaceOfflineWithNewOnline(
  offlineEntries: EntryFragment[],
  newOnlineEntries: EntryFragment[],
) {
  if (newOnlineEntries.length === 0) {
    return offlineEntries;
  }

  const offlineIdToOnlineEntryMap = newOnlineEntries.reduce((acc, item) => {
    acc[item.clientId as string] = item;
    return acc;
  }, {} as { [k: string]: EntryFragment });

  return offlineEntries.map(offlineEntry => {
    const onlineEntry =
      offlineIdToOnlineEntryMap[offlineEntry.clientId as string];

    if (onlineEntry) {
      return onlineEntry;
    }

    return offlineEntry;
  });
}

function replaceOfflineExperienceEntriesOfflineWithNewOnline(
  offlineEntries: EntryFragment[],
  newOnlineExperience: ExperienceFragment,
) {
  const offlineIdToOnlineEntryMap = (
    newOnlineExperience.entries.edges || []
  ).reduce((acc, edge) => {
    const entry = (edge as ExperienceFragment_entries_edges)
      .node as ExperienceFragment_entries_edges_node;

    acc[entry.clientId as string] = entry;
    return acc;
  }, {} as { [k: string]: EntryFragment });

  const offlineIdToOnlineDataDefinitionIdMap = newOnlineExperience.dataDefinitions.reduce(
    (acc, onlineDataDefinition) => {
      const { clientId, id } = onlineDataDefinition as DataDefinitionFragment;

      acc[clientId as string] = id;

      return acc;
    },
    {} as { [k: string]: string },
  );

  return offlineEntries.map(offlineEntry => {
    const onlineEntry =
      offlineIdToOnlineEntryMap[offlineEntry.clientId as string];

    if (onlineEntry) {
      return onlineEntry;
    }

    offlineEntry.dataObjects = replaceDataObjectsOfflineIdWithOnlineId(
      offlineEntry.dataObjects as DataObjectFragment[],
      offlineIdToOnlineDataDefinitionIdMap,
    );

    return offlineEntry;
  });
}

function replaceDataObjectsOfflineIdWithOnlineId(
  offlineDataObjects: DataObjectFragment[],
  offlineIdToOnlineDataDefinitionIdMap: { [k: string]: string },
) {
  return offlineDataObjects.map(offlineDataObject => {
    const onlineId =
      offlineIdToOnlineDataDefinitionIdMap[offlineDataObject.definitionId];

    if (onlineId) {
      offlineDataObject.definitionId = onlineId;
    }

    return offlineDataObject;
  });
}

////////////////////////// TYPES ////////////////////////////

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
  result: UploadOfflineItemsMutation | undefined | void;
}

interface DeleteActionPayload {
  id: string;
  mode: OnlineVal | OfflineVal;
}

export type ComponentProps = CallerProps &
  UseGetAllOfflineItemsProps &
  UseUploadOfflineItemsMutationProps &
  UseUploadOfflineExperiencesMutationProps &
  UseCreateEntriesMutationProps &
  Pick<EbnisContextProps, "persistor" | "cache" | "client"> & {
    layoutDispatch: LayoutDispatchType;
  };

export type CallerProps = RouteComponentProps;

type DraftState = Draft<StateMachine>;

export interface StateMachine {
  readonly states: {
    readonly submit: { value: InactiveVal };
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
  readonly effects: {
    general: { value: NoneVal } | GeneralEffect;
  };
}

interface GeneralEffect {
  value: YesVal;
  yes: {
    effects: EffectsList;
  };
}

export type TabsState = {
  context: TabStateContext;
} & (
  | {
      value: NoneVal;
    }
  | TabOne
  | TabTwo
);

interface TabOne {
  value: OneVal;
}

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
type SubmittingVal = "submitting";
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

interface OnDeleteExperiencePayload {
  experienceId: string;
  offlineEntries: EntryFragment[];
  mode: CreationMode;
}

type Action =
  | ({
      type: ActionType.ON_DELETE_EXPERIENCE;
    } & OnDeleteExperiencePayload)
  | {
      type: ActionType.ON_SUBMIT;
    }
  | {
      type: ActionType.ON_UPLOAD;
    }
  | ({
      type: ActionType.ON_UPLOAD_SUCCESS;
    } & SubmitResultPayload)
  | {
      type: ActionType.SERVER_ERROR;
      errors: ApolloError;
    }
  | {
      type: ActionType.CLEAR_SERVER_ERRORS;
    }
  | ({
      type: ActionType.ON_DATA_LOADED;
    } & DataLoadedPayload)
  | ({
      type: ActionType.DELETE_EXPERIENCE_SUCCESS;
    } & DeleteActionPayload)
  | ({
      type: ActionType.TOGGLE_TAB;
    } & TabStateTogglePayload);

interface SubmitResultPayload {
  results: UploadOfflineItemsMutation;
}

interface ToggleTabPayload {
  tabNumber: number | string;
}

interface DataLoadedPayload {
  allOfflineItems: GetOfflineItemsSummary;
}
export type DispatchType = Dispatch<Action>;

interface ServerErrorPayload {
  errors: ApolloError;
}

interface ThirdEffectFunctionArgs {
  dispatch: DispatchType;
}

type EffectsList = (
  | DeleteExperienceEffect
  | UpdateCacheEffect
  | SubmitEffect
)[];

interface EffectDefinition<A = {}> {
  key: keyof typeof effectFunctions;
  ownArgs: A;
  func?: (
    ownArgs: A,
    props: ComponentProps,
    thirdArgs: ThirdEffectFunctionArgs,
  ) => void | Promise<void>;
}

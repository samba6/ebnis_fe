import { EntryFragment } from "../../graphql/apollo-types/EntryFragment";
import { DataDefinitionFragment } from "../../graphql/apollo-types/DataDefinitionFragment";
import { Dispatch, Reducer, createContext } from "react";
import immer, { Draft } from "immer";
import {
  UpdateDefinitions_updateDefinitions_definitions,
  UpdateDefinitions_updateDefinitions_definitions_errors_errors,
  UpdateDefinitions_updateDefinitions_definitions_errors,
  UpdateDefinitions,
} from "../../graphql/apollo-types/UpdateDefinitions";
import { ExperienceFragment } from "../../graphql/apollo-types/ExperienceFragment";
import { DataObjectFragment } from "../../graphql/apollo-types/DataObjectFragment";
import { FormObjVal } from "../Experience/experience.utils";
import {
  DataTypes,
  UpdateDefinitionInput,
  UpdateDataObjectInput,
  CreateEntryInput,
} from "../../graphql/apollo-types/globalTypes";
import { UpdateDefinitionAndData } from "../../graphql/apollo-types/UpdateDefinitionAndData";
import {
  UpdateDataObjects_updateDataObjects,
  UpdateDataObjects_updateDataObjects_fieldErrors,
  UpdateDataObjects,
} from "../../graphql/apollo-types/UpdateDataObjects";
import { UpdateDataObjectsResponseFragment_fieldErrors } from "../../graphql/apollo-types/UpdateDataObjectsResponseFragment";
import { wrapReducer } from "../../logger";
import { ApolloError, ApolloClient } from "apollo-client";
import {
  formObjToString,
  ISO_DATE_FORMAT,
  interpretCreateEntryMutationException,
  typedErrorsToString,
  createEntryEffectHelper,
} from "../NewEntry/new-entry.utils";
import parseISO from "date-fns/parseISO";
import parse from "date-fns/parse";
import {
  UpdateDataObjectsOnlineMutationComponentProps,
  UpdateDefinitionsOnlineMutationComponentProps,
  UpdateDefinitionsAndDataOnlineMutationComponentProps,
  editEntryUpdate,
} from "./edit-entry.injectables";
import { CreateOnlineEntryMutationComponentProps } from "../../graphql/create-entry.mutation";
import { isOfflineId } from "../../constants";
import {
  CreateOnlineEntryMutation_createEntry,
  CreateOnlineEntryMutation_createEntry_errors_dataObjectsErrors,
} from "../../graphql/apollo-types/CreateOnlineEntryMutation";
import { decrementOfflineEntriesCountForExperience } from "../../apollo-cache/drecrement-offline-entries-count";
import { AppPersistor } from "../../context";
import { InMemoryCache } from "apollo-cache-inmemory";
import {
  LayoutDispatchType,
  LayoutActionType,
  LayoutContextValue,
} from "../Layout/layout.utils";
import { CreateOfflineEntryMutationComponentProps } from "../NewEntry/new-entry.resolvers";
import { upsertExperienceWithEntry } from "../NewEntry/new-entry.injectables";
import { incrementOfflineItemCount } from "../../apollo-cache/increment-offline-item-count";

export enum ActionType {
  EDIT_BTN_CLICKED = "@component/edit-entry/edit-btn-clicked",
  DEFINITION_NAME_CHANGED = "@component/edit-entry/definition-name-changed",
  UNDO_DEFINITION_EDITS = "@component/edit-entry/undo-definition-edits",
  STOP_DEFINITION_EDIT = "@component/edit-entry/stop-definition-edit",
  SUBMITTING = "@component/edit-entry/submitting",
  DESTROYED = "@component/edit-entry/destroy",
  DEFINITIONS_SUBMISSION_RESPONSE = "@component/edit-entry/definitions-submission-response",
  DATA_OBJECTS_SUBMISSION_RESPONSE = "@component/edit-entry/data-objects-submission-response",
  DEFINITION_FORM_ERRORS = "@component/edit-entry/definition-form-errors",
  DATA_CHANGED = "@component/edit-entry/data-changed",
  DEFINITION_AND_DATA_SUBMISSION_RESPONSE = "@component/edit-entry/submission-response",
  DISMISS_SUBMISSION_RESPONSE_MESSAGE = "@component/edit-entry/dismiss-submission-response-message",
  OTHER_ERRORS = "@component/edit-entry/other-errors",
  APOLLO_ERRORS = "@component/edit-entry/apollo-errors",
  ON_ENTRY_CREATED = "@component/edit-entry/online-entry-created",
  CONNECTION_CHANGED = "@component/edit-entry/connection-changed",
}

export const StateValue = {
  noEffect: "noEffect" as NoEffectVal,
  hasEffects: "hasEffects" as HasEffectsVal,
  active: "active" as ActiveVal,
  inactive: "inactive" as InActiveVal,
  single: "single" as SingleVal,
  multiple: "multiple" as MultipleVal,
  submitting: "submitting" as SubmittingVal,
  apolloErrors: "apolloErrors" as ApolloErrorValue,
  otherErrors: "otherErrors" as OtherErrorsVal,
  online: "online" as OnlineVal,
  offline: "offline" as OfflineVal,
};

export const initState = (props: ComponentProps): StateMachine => {
  const { entry, experience, hasConnection } = props;

  const [dataStates, dataIdsMap, dataIds] = entry.dataObjects.reduce(
    ([statesMap, dataIdsMap, dataIds], obj) => {
      const data = obj as DataObjectFragment;
      const { id } = data;
      dataIds.push(id);

      statesMap[id] = {
        value: "unchanged",

        unchanged: {
          context: {},
        },

        context: {
          defaults: {
            ...data,
            parsedVal: formObjFromRawString(data.data),
          } as DataState["context"]["defaults"],
        },
      };

      dataIdsMap[data.definitionId] = id;

      return [statesMap, dataIdsMap, dataIds];
    },
    [{} as DataStates, {} as { [k: string]: string }, [] as string[]],
  );

  const definitions = experience.dataDefinitions as DataDefinitionFragment[];

  let lenDefinitions = 0;
  const definitionAndDataIdsMapList: DefinitionAndDataIds[] = [];

  const definitionsStates = definitions.reduce((acc, definition) => {
    const { id: definitionId, type } = definition;
    ++lenDefinitions;

    acc[definitionId] = {
      value: "idle",

      idle: {
        context: {},
      },

      context: {
        defaults: definition,
      },
    };

    const definitionAndDataIdsMap = {
      definitionId,
    } as DefinitionAndDataIds;

    definitionAndDataIdsMapList.push(definitionAndDataIdsMap);

    const dataId = dataIdsMap[definitionId];

    if (dataId) {
      definitionAndDataIdsMap.dataId = dataId;
      const dataState = dataStates[dataId];
      dataState.context.defaults.type = type;
    }

    return acc;
  }, {} as DefinitionsStates);

  if (definitionAndDataIdsMapList.length === 0) {
    dataIds.forEach(id =>
      definitionAndDataIdsMapList.push({
        dataId: id,
      } as DefinitionAndDataIds),
    );
  }

  return {
    effects: {
      runOnRenders: {
        value: StateValue.noEffect,
      },
    },
    context: {
      lenDefinitions,
      definitionAndDataIdsMapList,
      experience,
      entry,
      hasConnection,
    },
    states: {
      createMode: {
        value: isOfflineId(entry.id) ? StateValue.offline : StateValue.online,
      },
      editingData: {
        value: StateValue.inactive,
      },
      editingDefinition: {
        value: StateValue.inactive,
      },
      submission: {
        value: StateValue.inactive,
      },
      definitionsStates,
      dataStates,
    },
  };
};

export const reducer: Reducer<StateMachine, Action> = (state, action) =>
  wrapReducer<StateMachine, Action>(
    state,
    action,
    (prevState, { type, ...payload }) => {
      return immer(prevState, proxy => {
        proxy.effects.runOnRenders.value = StateValue.noEffect;

        switch (type) {
          case ActionType.DATA_CHANGED:
            handleDataChangedAction(proxy, payload as DataChangedPayload);
            break;

          case ActionType.DEFINITION_NAME_CHANGED:
            handleDefinitionNameChangedAction(
              proxy,
              payload as DefinitionNameChangedPayload,
            );
            break;

          case ActionType.EDIT_BTN_CLICKED:
            handleDefinitionEditingUnchangedAction(
              proxy,
              (payload as IdString).id,
            );
            break;

          case ActionType.UNDO_DEFINITION_EDITS:
            handleUndoDefinitionEdits(proxy, payload as IdString);
            break;

          case ActionType.STOP_DEFINITION_EDIT:
            handleStopDefinitionEdit(proxy, payload as IdString);
            break;

          case ActionType.SUBMITTING:
            handleSubmittingAction(proxy, payload as SubmittingPayload);
            break;

          case ActionType.DEFINITIONS_SUBMISSION_RESPONSE:
            prepareSubmissionResponse(proxy, {
              key: "definitions",
              definitionsResults: payload as UpdateDefinitions,
            });
            break;

          case ActionType.DATA_OBJECTS_SUBMISSION_RESPONSE:
            prepareSubmissionResponse(proxy, {
              key: "dataObjects",
              dataObjectsResults: payload as UpdateDataObjects,
            });
            break;

          case ActionType.ON_ENTRY_CREATED:
            prepareSubmissionResponse(proxy, {
              key: "onlineEntry",
              onlineEntryResults: (payload as OnlineEntryCreatedPayload)
                .serverResult,
            });
            break;

          case ActionType.DEFINITION_FORM_ERRORS:
            handleDefinitionFormErrorsAction(
              proxy,
              payload as DefinitionFormErrorsPayload,
            );
            break;

          case ActionType.OTHER_ERRORS:
            handleOtherErrorsAction(
              proxy,
              (payload as { error?: string }).error,
            );
            break;

          case ActionType.APOLLO_ERRORS:
            handleApolloErrorsAction(proxy, payload as ApolloErrorsPayload);
            break;

          case ActionType.DEFINITION_AND_DATA_SUBMISSION_RESPONSE:
            handleDefinitionAndDataSubmissionResponse(
              proxy,
              payload as UpdateDefinitionAndData,
            );
            break;

          case ActionType.DISMISS_SUBMISSION_RESPONSE_MESSAGE:
            proxy.states.submission.value = StateValue.inactive;
            break;
        }
      });
    },

    // true,
  );

////////////////////////// EFFECT FUNCTIONS SECTION //////////////////

const decrementOfflineEntriesCountEffect: DecrementOfflineEntriesCountEffect["func"] = async (
  { experienceId },
  { cache, persistor, layoutDispatch },
) => {
  await decrementOfflineEntriesCountForExperience({
    cache,
    experienceId,
    howMany: 1,
  });

  await persistor.persist();

  layoutDispatch({
    type: LayoutActionType.REFETCH_OFFLINE_ITEMS_COUNT,
  });
};

type DecrementOfflineEntriesCountEffect = EffectDefinition<
  "decrementOfflineEntriesCount",
  {
    experienceId: string;
  }
>;

const createEntryEffect: CreateEntryEffect["func"] = async (
  { input, experience },
  { createOfflineEntry, createOnlineEntry, persistor },
  { dispatch },
) => {
  try {
    const validResponse = await createEntryEffectHelper(
      { input, experience },
      { createOfflineEntry, createOnlineEntry },
    );

    if (validResponse.entry || validResponse.errors) {
      persistor.persist();
      dispatch({
        type: ActionType.ON_ENTRY_CREATED,
        serverResult: validResponse,
      });

      return;
    }

    dispatch({
      type: ActionType.OTHER_ERRORS,
    });
  } catch (errors) {
    dispatch({
      type: ActionType.OTHER_ERRORS,
      error: interpretCreateEntryMutationException(errors),
    });
  }
};

type CreateEntryEffect = EffectDefinition<
  "createEntry",
  {
    input: CreateEntryInput;
    experience: ExperienceFragment;
  }
>;

const updateEntryOfflineEffect: UpdateEntryOfflineEffect["func"] = async (
  { entry },
  { layoutDispatch, client, persistor, cache },
) => {
  const { experienceId } = entry;

  (await upsertExperienceWithEntry(experienceId, "offline")(client, {
    data: { createEntry: { entry } as CreateOnlineEntryMutation_createEntry },
  })) as ExperienceFragment;

  // why pass noupdate flag?
  incrementOfflineItemCount(cache, experienceId, "noupdate");
  await persistor.persist();

  layoutDispatch({
    type: LayoutActionType.REFETCH_OFFLINE_ITEMS_COUNT,
  });
};

type UpdateEntryOfflineEffect = EffectDefinition<
  "updateEntryOffline",
  {
    entry: EntryFragment;
  }
>;

const definitionsFormErrorsEffect: DefinitionsFormErrorsEffect["func"] = (
  { definitionsWithFormErrors },
  _,
  { dispatch },
) => {
  dispatch({
    type: ActionType.DEFINITION_FORM_ERRORS,
    ids: definitionsWithFormErrors,
  });
};

type DefinitionsFormErrorsEffect = EffectDefinition<
  "definitionsFormErrors",
  {
    definitionsWithFormErrors: string[];
  }
>;

const updateDefinitionsOnlineEffect: UpdateDefinitionsOnlineEffect["func"] = async (
  { experienceId, definitionsInput },
  { updateDefinitionsOnline },
  { dispatch },
) => {
  try {
    const result = await updateDefinitionsOnline({
      variables: {
        input: {
          experienceId,
          definitions: definitionsInput,
        },
      },
      update: editEntryUpdate,
    });

    const validResponse = result && result.data;

    if (validResponse) {
      dispatch({
        type: ActionType.DEFINITIONS_SUBMISSION_RESPONSE,
        ...validResponse,
      });

      return;
    }

    dispatch({
      type: ActionType.OTHER_ERRORS,
    });
  } catch (errors) {
    processFormSubmissionException({
      dispatch,
      errors,
    });
  }
};

type UpdateDefinitionsOnlineEffect = EffectDefinition<
  "updateDefinitionsOnline",
  {
    experienceId: string;
    definitionsInput: UpdateDefinitionInput[];
  }
>;

const updateDataObjectsOnlineEffect: UpdateDataObjectsOnlineEffect["func"] = async (
  { dataInput },
  { updateDataObjectsOnline },
  { dispatch },
) => {
  try {
    const response = await updateDataObjectsOnline({
      variables: {
        input: dataInput,
      },

      update: editEntryUpdate,
    });

    const successResult = response && response.data;

    if (successResult) {
      dispatch({
        type: ActionType.DATA_OBJECTS_SUBMISSION_RESPONSE,
        ...successResult,
      });

      return;
    }

    dispatch({
      type: ActionType.OTHER_ERRORS,
    });
  } catch (errors) {
    processFormSubmissionException({ dispatch, errors });
  }
};

type UpdateDataObjectsOnlineEffect = EffectDefinition<
  "updateDataObjectsOnline",
  {
    dataInput: UpdateDataObjectInput[];
  }
>;

const updateDefinitionsAndDataOnlineEffect: UpdateDefinitionsAndDataOnlineEffect["func"] = async (
  { experienceId, definitionsInput, dataInput },
  { updateDefinitionsAndDataOnline },
  { dispatch },
) => {
  try {
    const response = await updateDefinitionsAndDataOnline({
      variables: {
        definitionsInput: {
          experienceId,
          definitions: definitionsInput,
        },
        dataInput,
      },
      update: editEntryUpdate,
    });

    const validResponse = response && response.data;

    if (validResponse) {
      dispatch({
        type: ActionType.DEFINITION_AND_DATA_SUBMISSION_RESPONSE,
        ...validResponse,
      });

      return;
    }

    dispatch({
      type: ActionType.OTHER_ERRORS,
    });
  } catch (errors) {
    processFormSubmissionException({ errors, dispatch });
  }
};

type UpdateDefinitionsAndDataOnlineEffect = EffectDefinition<
  "updateDefinitionsAndDataOnline",
  {
    dataInput: UpdateDataObjectInput[];
    experienceId: string;
    definitionsInput: UpdateDefinitionInput[];
  }
>;

export const effectFunctions = {
  updateDefinitionsAndDataOnline: updateDefinitionsAndDataOnlineEffect,
  updateDataObjectsOnline: updateDataObjectsOnlineEffect,
  updateDefinitionsOnline: updateDefinitionsOnlineEffect,
  definitionsFormErrors: definitionsFormErrorsEffect,
  createEntry: createEntryEffect,
  decrementOfflineEntriesCount: decrementOfflineEntriesCountEffect,
  updateEntryOffline: updateEntryOfflineEffect,
};

//// EFFECT HELPERS

function processFormSubmissionException({
  dispatch,
  errors,
}: {
  dispatch: DispatchType;
  errors: Error;
}) {
  if (errors instanceof ApolloError) {
    dispatch({
      type: ActionType.APOLLO_ERRORS,
      errors,
    });
  } else {
    dispatch({
      type: ActionType.OTHER_ERRORS,
    });
  }
}

export function runEffects(
  effects: EffectsList,
  props: ComponentProps,
  thirdArgs: ThirdEffectFunctionArgs,
) {
  for (const { key, ownArgs } of effects) {
    effectFunctions[key](
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
      ownArgs as any,
      props,
      thirdArgs,
    );
  }
}

////////////////////////// END EFFECT FUNCTIONS SECTION /////////////////

/////////////////// STATE UPDATE FUNCTIONS SECTION /////////////

function handleDefinitionNameChangedAction(
  proxy: DraftState,
  payload: DefinitionNameChangedPayload,
) {
  const { id, formValue } = payload;
  const state = proxy.states.definitionsStates[id];
  state.value = "editing";
  const { name: defaultName } = state.context.defaults;
  const editingState = state as DefinitionEditingState;

  if (defaultName === formValue.trim()) {
    editingState.editing = {
      value: "unchanged",

      context: {
        formValue: defaultName,
      },
    };
    handleDefinitionEditingUnchangedAction(proxy, id);
  } else {
    editingState.editing = {
      value: "changed",

      context: {
        formValue,
      },

      changed: {
        value: "regular",
      },
    };
  }

  setEditingDefinitionState(proxy, id);
}

function handleSubmittingAction(proxy: DraftState, payload: SubmittingPayload) {
  proxy.states.submission.value = StateValue.submitting;
  const effectObjects = getRenderEffects(proxy);
  const { hasConnection } = payload;

  if (!hasConnection) {
    handleUpdateEntryOfflineAction(proxy, effectObjects);
    return;
  }

  if (proxy.states.createMode.value === StateValue.offline) {
    handleCreateEntryAction(proxy, effectObjects);
    return;
  }

  handleSubmittingUpdateDataAndOrDefinitionAction({
    proxy,
    effectObjects,
  });
}

function handleDefinitionFormErrorsAction(
  proxy: DraftState,
  payload: DefinitionFormErrorsPayload,
) {
  const primaryStateFormErrors = {
    value: "formErrors",
    formErrors: {
      context: {
        errors: "please correct the highlighted errors and resubmit",
      },
    },
  } as Submission;

  proxy.states.submission = {
    ...proxy.states.submission,
    ...primaryStateFormErrors,
  };

  const { ids } = payload as DefinitionFormErrorsPayload;

  const errors = {
    name: "should be at least 2 characters long.",
  };

  for (const id of ids) {
    const definitionState = proxy.states.definitionsStates[id];

    ((definitionState as DefinitionEditingState)
      .editing as DefinitionChangedState).changed = {
      value: "formErrors",
      context: {
        errors,
      },
    };
  }
}

function handleOtherErrorsAction(
  proxy: DraftState,
  error = "We apologize, we are unable to fulfill your request this time",
) {
  const otherErrorsState = {
    value: StateValue.otherErrors,
    otherErrors: {
      context: {
        errors: error,
      },
    },
  } as Submission;

  proxy.states.submission = {
    ...proxy.states.submission,
    ...otherErrorsState,
  };
}

function handleStopDefinitionEdit(proxy: DraftState, payload: IdString) {
  const { id } = payload as IdString;
  const { definitionsStates } = proxy.states;

  definitionsStates[id].value = "idle";

  setEditingDefinitionState(proxy, id);
}

function handleDefinitionAndDataSubmissionResponse(
  proxy: DraftState,
  payload: UpdateDefinitionAndData,
) {
  const {
    updateDefinitions,
    updateDataObjects,
  } = payload as UpdateDefinitionAndData;

  prepareSubmissionResponse(proxy, {
    key: "definitions and dataObjects",
    definitionsResults: { updateDefinitions },
    dataObjectsResults: { updateDataObjects },
  });
}

function handleUndoDefinitionEdits(proxy: DraftState, payload: IdString) {
  const { id } = payload as IdString;
  handleDefinitionEditingUnchangedAction(proxy, id);
  setEditingDefinitionState(proxy, id);
}

function handleDataChangedAction(
  proxy: DraftState,
  payload: DataChangedPayload,
) {
  const { dataStates } = proxy.states;
  const { id, rawFormVal } = payload as DataChangedPayload;
  const state = dataStates[id];
  const { parsedVal, type } = state.context.defaults;

  const [original, stringed] = formObjToCompareString(type, rawFormVal);

  if (formObjToCompareString(type, parsedVal)[1] === stringed) {
    state.value = "unchanged";
  } else {
    state.value = "changed";
    const changedState = state as DataChangedState;

    changedState.changed = {
      context: {
        formValue: original,
        formValueString: stringed as string,
      },

      value: "normal",
    };
  }

  setEditingData(proxy);
}

function handleApolloErrorsAction(
  proxy: DraftState,
  payload: ApolloErrorsPayload,
) {
  const {
    errors: { graphQLErrors, networkError },
  } = payload as ApolloErrorsPayload;

  const apolloErrorsState = {
    value: StateValue.apolloErrors,
    apolloErrors: {
      context: {
        errors: networkError ? networkError.message : graphQLErrors[0].message,
      },
    },
  } as Submission;

  proxy.states.submission = {
    ...proxy.states.submission,
    ...apolloErrorsState,
  };
}

function handleOnEntryCreatedAction(
  proxy: DraftState,
  context: SubmissionSuccessStateContext,
  response: CreateOnlineEntryMutation_createEntry,
) {
  const effectObjects = getRenderEffects(proxy);
  const { entry: ent, errors } = response;

  if (errors) {
    let errorString = "Please correct form errors and resubmit";
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars*/
    const { dataObjectsErrors, clientId, ...rest } = errors;
    errorString += typedErrorsToString(rest);
    const errorContext = context.invalidResponse as SubmissionInvalidResponse;
    errorContext.entry = errorString;

    if (!dataObjectsErrors) {
      return [0, 1];
    }

    let failureCount = 0;
    const { dataStates } = proxy.states;

    dataObjectsErrors.forEach(obj => {
      const {
        clientId,
        errors,
      } = obj as CreateOnlineEntryMutation_createEntry_errors_dataObjectsErrors;

      const dataState = dataStates[clientId as string];
      ++failureCount;

      putDataServerErrors(
        dataState as DataChangedState,
        errors as UpdateDataObjectsResponseFragment_fieldErrors,
      );
    });

    return [0, failureCount];
  }

  const entry = ent as EntryFragment;
  const { id: entryId, clientId: entryOfflineId } = entry;
  const { dataStates, createMode } = proxy.states;
  const { context: globalContext } = proxy;
  const definitionAndDataIdsMapList = globalContext.definitionAndDataIdsMapList;

  entry.dataObjects.forEach((obj, index) => {
    const dataObject = obj as DataObjectFragment;
    const { clientId, id: dataId, definitionId } = dataObject;
    let fetchId = dataId;

    // entry was created offline and now synced to server
    if (entryOfflineId !== entryId) {
      fetchId = clientId as string;
    }

    const dataState = dataStates[fetchId];
    updateDataStateWithUpdatedDataObject(dataState, dataObject);
    delete dataStates[fetchId];
    dataStates[dataId] = dataState;

    definitionAndDataIdsMapList[index] = {
      definitionId,
      dataId,
    };
  });

  effectObjects.push({
    key: "decrementOfflineEntriesCount",
    ownArgs: { experienceId: entry.experienceId },
  });
  createMode.value = StateValue.online;
  globalContext.entry = entry;
  return [1, 0, "valid"];
}

function getRenderEffects(proxy: DraftState) {
  const runOnRendersEffects = proxy.effects.runOnRenders as EffectState;
  runOnRendersEffects.value = StateValue.hasEffects;
  const effectObjects: EffectsList = [];
  runOnRendersEffects.hasEffects = {
    context: {
      effects: effectObjects,
    },
  };

  return effectObjects;
}

function prepareSubmissionResponse(
  proxy: DraftState,
  payload:
    | UpdateWithDefinitionsAndDataObjectsSubmissionResponse
    | UpdateWithDefinitionsSubmissionResponse
    | UpdateWithDataObjectsSubmissionResponse
    | UpdateWithOnlineEntrySubmissionResponse,
) {
  const { states } = proxy;
  const {
    submitting: {
      context: { submittedCount },
    },
  } = states.submission as Submitting;

  const context = {
    invalidResponse: {},
  } as SubmissionSuccessStateContext;

  let successCount = 0;
  let failureCount = 0;

  let t1 = "valid";
  let t2 = "valid";
  let t3 = "valid";

  if (
    payload.key === "dataObjects" ||
    payload.key == "definitions and dataObjects"
  ) {
    const [s, f, t] = handleDataObjectSubmissionResponse(
      proxy,
      context,
      payload.dataObjectsResults,
    ) as [number, number, string];

    successCount += s;
    failureCount += f;
    t1 = t;
  }

  if (
    payload.key === "definitions" ||
    payload.key === "definitions and dataObjects"
  ) {
    const [s, f, t] = handleDefinitionsSubmissionResponse(
      proxy,
      context,
      payload.definitionsResults,
    ) as [number, number, string];

    successCount += s;
    failureCount += f;
    t2 = t;
  }

  if (payload.key === "onlineEntry") {
    const [s, f, t] = handleOnEntryCreatedAction(
      proxy,
      context,
      payload.onlineEntryResults,
    ) as [number, number, string];

    successCount += s;
    failureCount += f;
    t3 = t;
  }

  if (t2 === "valid" && t1 === "valid" && t3 === "valid") {
    delete context.invalidResponse;
  }

  if (successCount + failureCount !== 0) {
    context.validResponse = {
      successes: successCount,
      failures: failureCount,
    };
  }

  const submissionSuccessResponse = {
    value: "submissionSuccess",
    submissionSuccess: {
      context,
    },
  } as SubmissionSuccessState;

  states.submission = {
    ...states.submission,
    ...submissionSuccessResponse,
  };

  if (submittedCount === successCount) {
    states.editingData.value = StateValue.inactive;
  }
}

function handleDefinitionEditingUnchangedAction(proxy: DraftState, id: string) {
  const { states } = proxy;
  const { definitionsStates } = states;
  const state = definitionsStates[id];
  state.value = "editing";
  (state as DefinitionEditingState).editing = {
    value: "unchanged",

    context: {
      formValue: state.context.defaults.name,
    },
  };
  states.definitionsStates[id] = { ...definitionsStates[id], ...state };
}

function setEditingDefinitionState(
  proxy: DraftState,
  mostRecentlyInterractedWithDefinitionId: string,
) {
  let changedDefinitionsCount = 0;
  let previousMostRecentlyChangedDefinitionId = "";
  const { states } = proxy;

  if (states.editingDefinition.value === StateValue.multiple) {
    previousMostRecentlyChangedDefinitionId =
      states.editingDefinition[StateValue.multiple].context
        .mostRecentlyChangedDefinitionId;
  }

  for (const [id, state] of Object.entries(states.definitionsStates)) {
    if (state.value === "editing" && state.editing.value === "changed") {
      ++changedDefinitionsCount;
    } else if (id === mostRecentlyInterractedWithDefinitionId) {
      // if the definition is not editing.changed, then it can not be set as
      // mostRecentlyChangedDefinitionId
      mostRecentlyInterractedWithDefinitionId = "";
    }
  }

  const mostRecentlyChangedDefinitionId = mostRecentlyInterractedWithDefinitionId
    ? mostRecentlyInterractedWithDefinitionId
    : previousMostRecentlyChangedDefinitionId;

  if (changedDefinitionsCount === 0) {
    states.editingDefinition.value = StateValue.inactive;
  } else if (changedDefinitionsCount === 1) {
    states.editingDefinition.value = StateValue.single;
  } else {
    (states.editingDefinition as EditingMultipleDefinitionsState) = {
      value: StateValue.multiple,
      multiple: {
        context: {
          mostRecentlyChangedDefinitionId,
        },
      },
    };
  }
}

function updateDataStateWithUpdatedDataObject(
  dataState: DataState,
  dataObject: DataObjectFragment,
) {
  dataState.context.defaults = {
    ...dataState.context.defaults,
    ...dataObject,
  };

  dataState.context.defaults.parsedVal = formObjFromRawString(dataObject.data);

  const unchangedState = (dataState as unknown) as DataUnchangedState;
  unchangedState.value = "unchanged";
  unchangedState.unchanged.context.anyEditSuccess = true;
}

function handleDataObjectSubmissionResponse(
  proxy: DraftState,
  context: SubmissionSuccessStateContext,
  updateDataObjectsResults: UpdateDataObjects,
) {
  const dataObjects =
    updateDataObjectsResults && updateDataObjectsResults.updateDataObjects;

  if (!dataObjects) {
    (context.invalidResponse as SubmissionInvalidResponse).data =
      "unable to update data: unknown error occurred";

    return [0, 0];
  }

  let successCount = 0;
  let failureCount = 0;
  const { dataStates } = proxy.states;

  dataObjects.forEach(obj => {
    const {
      id,
      dataObject,
      stringError,
      fieldErrors,
    } = obj as UpdateDataObjects_updateDataObjects;

    const dataState = dataStates[id];

    if (dataObject) {
      updateDataStateWithUpdatedDataObject(dataState, dataObject);
      ++successCount;
    } else if (stringError) {
      ++failureCount;

      putDataServerErrors(
        dataState as DataChangedState,

        {
          definition: stringError as string,
        } as UpdateDataObjects_updateDataObjects_fieldErrors,
      );
    } else {
      ++failureCount;
      putDataServerErrors(
        dataState as DataChangedState,
        fieldErrors as UpdateDataObjectsResponseFragment_fieldErrors,
      );
    }
  });

  return [successCount, failureCount, "valid"];
}

function putDataServerErrors(
  state: DataChangedState,
  errors: UpdateDataObjectsResponseFragment_fieldErrors,
) {
  state.changed.value = "serverErrors";

  (state.changed as DataServerErrorsState).serverErrors = {
    context: { errors },
  };
}

function handleDefinitionsSubmissionResponse(
  proxy: DraftState,
  context: SubmissionSuccessStateContext,
  updateDefinitionsResults: UpdateDefinitions,
) {
  const definitions =
    updateDefinitionsResults &&
    updateDefinitionsResults.updateDefinitions &&
    updateDefinitionsResults.updateDefinitions.definitions;

  if (!definitions) {
    (context.invalidResponse as SubmissionInvalidResponse).definitions =
      "unable to change defintion names: unknown error occurred";
    return [0, 0];
  }

  const { definitionsStates } = proxy.states;
  let successCount = 0;
  let failureCount = 0;

  definitions.forEach(def => {
    const {
      definition,
      errors,
    } = def as UpdateDefinitions_updateDefinitions_definitions;

    if (definition) {
      ++successCount;

      const { id, name } = definition;
      const state = definitionsStates[id];
      state.context.defaults.name = name;

      state.value = "idle";

      (state as DefinitionIdleState).idle.context.anyEditSuccess = true;

      return;
    } else {
      ++failureCount;

      const {
        id,
        ...errorsContext
      } = errors as UpdateDefinitions_updateDefinitions_definitions_errors;
      const state = definitionsStates[id] as DefinitionEditingState;

      (state.editing as DefinitionChangedState).changed = {
        value: "serverErrors",
        context: { ...errorsContext },
      };
    }
  });

  return [successCount, failureCount, "valid"];
}

async function handleSubmittingUpdateDataAndOrDefinitionAction({
  proxy,
  effectObjects,
}: {
  proxy: DraftState;
  effectObjects: EffectsList;
}) {
  const { states } = proxy;
  const [definitionsInput, definitionsWithFormErrors] = getDefinitionsToSubmit(
    states.definitionsStates,
  ) as [UpdateDefinitionInput[], string[]];

  const [dataInput] = getDataObjectsForOnlineUpdate(states.dataStates);

  states.submission = {
    value: StateValue.submitting,
    submitting: {
      context: {
        submittedCount:
          definitionsInput.length +
          definitionsWithFormErrors.length +
          dataInput.length,
      },
    },
  };

  if (definitionsWithFormErrors.length !== 0) {
    effectObjects.push({
      key: "definitionsFormErrors",
      ownArgs: {
        definitionsWithFormErrors,
      },
    });

    return;
  }

  const {
    experience: { id: experienceId },
  } = proxy.context;

  if (dataInput.length === 0) {
    effectObjects.push({
      key: "updateDefinitionsOnline",
      ownArgs: {
        definitionsInput,
        experienceId,
      },
    });

    return;
  }

  if (definitionsInput.length === 0) {
    effectObjects.push({
      key: "updateDataObjectsOnline",
      ownArgs: {
        dataInput,
      },
    });

    return;
  }

  effectObjects.push({
    key: "updateDefinitionsAndDataOnline",
    ownArgs: {
      experienceId,
      dataInput,
      definitionsInput,
    },
  });
}

function setEditingData(proxy: DraftState) {
  let dataChangedCount = 0;
  const { states } = proxy;

  for (const state of Object.values(states.dataStates)) {
    if (state.value === "changed") {
      ++dataChangedCount;
    }
  }

  if (dataChangedCount === 0) {
    states.editingData.value = StateValue.inactive;
  } else {
    states.editingData.value = StateValue.active;
  }
}

function handleCreateEntryAction(
  proxy: DraftState,
  effectObjects: EffectsList,
) {
  const {
    states,
    context: { experience, entry },
  } = proxy;

  states.submission = {
    value: StateValue.submitting,
    submitting: {
      context: {
        submittedCount: 1,
      },
    },
  };

  const { dataStates } = states;

  const dataObjects = entry.dataObjects.map(obj => {
    const { id, definitionId } = obj as DataObjectFragment;
    const dataState = dataStates[id];

    const {
      context: {
        defaults: { type, parsedVal },
      },
    } = dataState;

    const formValue =
      dataState.value === "changed"
        ? dataState.changed.context.formValue
        : parsedVal;

    return {
      clientId: id,
      data: makeDataObjectData(type, formValue),
      definitionId,
    };
  });

  effectObjects.push({
    key: "createEntry",
    ownArgs: {
      input: {
        dataObjects,
        experienceId: experience.id,
      },
      experience,
    },
  });

  return;
}

///// STATE UPDATE... HELPERS

function formObjFromRawString(val: string): FormObjVal {
  const [[k, v]] = Object.entries(JSON.parse(val));

  switch (k) {
    case "datetime":
      return parseISO(v);

    case "date":
      return parse(v, ISO_DATE_FORMAT, new Date());

    default:
      return (("" + v) as string).trim();
  }
}

function formObjToCompareString(type: DataTypes, val: FormObjVal) {
  const stringVal = formObjToString(type, val);

  return [val, stringVal];
}

function getDataObjectsForOfflineUpdate(
  dataObjects: DataObjectFragment[],
  dataStates: DataStates,
  updateTime: string,
) {
  let updatedCount = 0;

  dataObjects.forEach(obj => {
    const { id } = obj;
    const d = dataStates[id];
    const dataState = d;

    if (dataState.value === "changed") {
      const {
        context: {
          defaults: { type },
        },
        changed: {
          context: { formValue },
        },
      } = dataState;

      obj.data = makeDataObjectData(type, formValue);
      obj.updatedAt = updateTime;
      d.value = "unchanged";

      (d as DataUnchangedState).unchanged.context.anyEditSuccess = true;

      ++updatedCount;
    }
  });

  return updatedCount;
}

function getDataObjectsForOnlineUpdate(dataStates: DataStates) {
  const inputs: UpdateDataObjectInput[] = [];

  for (const [id, dataState] of Object.entries(dataStates)) {
    if (dataState.value === "changed") {
      const {
        context: {
          defaults: { type },
        },
        changed: {
          context: { formValue },
        },
      } = dataState;

      inputs.push({
        id,
        data: makeDataObjectData(type, formValue),
      });
    }
  }

  return [inputs];
}

function makeDataObjectData(type: DataTypes, formValue: FormObjVal) {
  return `{"${type.toLowerCase()}":"${formObjToString(type, formValue)}"}`;
}

function getDefinitionsToSubmit(allDefinitionsStates: DefinitionsStates) {
  const input: UpdateDefinitionInput[] = [];
  const withErrors: string[] = [];

  for (const [id, state] of Object.entries(allDefinitionsStates)) {
    if (state.value === "editing" && state.editing.value === "changed") {
      const name = state.editing.context.formValue.trim();

      if (name.length < 2) {
        withErrors.push(id);
      } else {
        input.push({
          id,
          name,
        });
      }
    }
  }

  return [input, withErrors];
}

function handleUpdateEntryOfflineAction(
  proxy: DraftState,
  effectObjects: EffectsList,
) {
  const {
    states,
    context: { entry },
  } = proxy;

  const updateTime = (new Date()).toJSON()
  entry.updatedAt = updateTime;
  entry.modOffline = true;

  const updatedCount = getDataObjectsForOfflineUpdate(
    entry.dataObjects as DataObjectFragment[],
    states.dataStates,
    updateTime,
  );

  const submissionSuccessResponse = {
    value: "submissionSuccess",
    submissionSuccess: {
      context: {
        validResponse: { successes: updatedCount },
      },
    },
  } as SubmissionSuccessState;

  states.submission = {
    ...states.submission,
    ...submissionSuccessResponse,
  };

  states.editingData.value = StateValue.inactive;

  effectObjects.push({
    key: "updateEntryOffline",
    ownArgs: {
      entry,
    },
  });
}

////////////////////// END STATE UPDATE FUNCTIONS SECTION ///////////////////

export const EditEnryContext = createContext<ContextValue>({} as ContextValue);

////////////////////////// TYPES ////////////////////////////

interface ContextValue {
  dispatch: DispatchType;
  onSubmit: () => void;
  hasConnection: LayoutContextValue["hasConnection"];
}

type DraftState = Draft<StateMachine>;

export interface StateMachine {
  readonly context: {
    readonly lenDefinitions: number;
    readonly definitionAndDataIdsMapList: DefinitionAndDataIds[];
    readonly experience: ExperienceFragment;
    readonly entry: EntryFragment;
    readonly hasConnection: LayoutContextValue["hasConnection"];
  };
  readonly effects: {
    runOnRenders: EffectState | { value: NoEffectVal };
  };
  states: {
    readonly createMode: { value: OfflineVal } | { value: OnlineVal };
    readonly dataStates: DataStates;
    readonly definitionsStates: DefinitionsStates;
    readonly editingData: {
      value: ActiveVal | InActiveVal;
    };
    readonly editingDefinition:
      | {
          value: SingleVal;
        }
      | {
          value: InActiveVal;
        }
      | EditingMultipleDefinitionsState;
    readonly submission: Submission;
  };
}

interface RunOnceEffectState<IEffect> {
  run: boolean;
  effect: IEffect;
}

interface EffectState {
  value: HasEffectsVal;
  hasEffects: {
    context: {
      effects: EffectsList;
    };
  };
}

type EffectsList = (
  | UpdateDefinitionsOnlineEffect
  | CreateEntryEffect
  | DefinitionsFormErrorsEffect
  | UpdateDataObjectsOnlineEffect
  | UpdateDefinitionsAndDataOnlineEffect
  | DecrementOfflineEntriesCountEffect
  | UpdateEntryOfflineEffect
)[];

interface ThirdEffectFunctionArgs {
  dispatch: DispatchType;
}

interface EffectDefinition<
  Key extends keyof typeof effectFunctions,
  OwnArgs = {}
> {
  key: Key;
  ownArgs: OwnArgs;
  func?: (
    ownArgs: OwnArgs,
    effectArgs: ComponentProps,
    lastArgs: ThirdEffectFunctionArgs,
  ) => void | Promise<void | (() => void)> | (() => void);
}

interface DefinitionAndDataIds {
  definitionId: string;
  dataId: string;
}

////////////////////////// STRINGGY TYPES SECTION //////////////////////
type NoEffectVal = "noEffect";
type HasEffectsVal = "hasEffects";
type InActiveVal = "inactive";
type SingleVal = "single";
type MultipleVal = "multiple";
type ActiveVal = "active";
type SubmittingVal = "submitting";
type ApolloErrorValue = "apolloErrors";
type OtherErrorsVal = "otherErrors";
type OnlineVal = "online";
type OfflineVal = "offline";
////////////////////////// END STRINGGY TYPES SECTION //////////////////

interface Submitting {
  value: SubmittingVal;
  submitting: {
    context: {
      submittedCount: number;
    };
  };
}

export type Submission =
  | {
      value: InActiveVal;
    }
  | Submitting
  | (
      | {
          value: ApolloErrorValue;
          apolloErrors: {
            context: {
              errors: string;
            };
          };
        }
      | SubmissionSuccessState
      | {
          value: OtherErrorsVal;
          otherErrors: {
            context: {
              errors: string;
            };
          };
        }
      | SubmissionFormErrors
    );

interface SubmissionFormErrors {
  value: "formErrors";

  formErrors: {
    context: {
      errors: string;
    };
  };
}

interface SubmissionSuccessState {
  value: "submissionSuccess";

  submissionSuccess: {
    context: SubmissionSuccessStateContext;
  };
}

interface SubmissionSuccessStateContext {
  validResponse?: {
    successes: number;
    failures: number;
  };

  invalidResponse?: SubmissionInvalidResponse;
}

interface SubmissionInvalidResponse {
  data?: string;
  definitions?: string;
  entry?: string;
}

export interface EditingMultipleDefinitionsState {
  value: MultipleVal;
  multiple: {
    context: {
      mostRecentlyChangedDefinitionId: string;
    };
  };
}

export type Action =
  | ({
      type: ActionType.ON_ENTRY_CREATED;
    } & OnlineEntryCreatedPayload)
  | {
      type: ActionType.EDIT_BTN_CLICKED;
      id: string;
    }
  | ({
      type: ActionType.DEFINITION_NAME_CHANGED;
    } & DefinitionNameChangedPayload)
  | {
      type: ActionType.UNDO_DEFINITION_EDITS;
      id: string;
    }
  | {
      type: ActionType.STOP_DEFINITION_EDIT;
      id: string;
    }
  | ({
      type: ActionType.SUBMITTING;
    } & SubmittingPayload)
  | {
      type: ActionType.DESTROYED;
    }
  | ({
      type: ActionType.DEFINITIONS_SUBMISSION_RESPONSE;
    } & UpdateDefinitions)
  | ({
      type: ActionType.DEFINITION_FORM_ERRORS;
    } & DefinitionFormErrorsPayload)
  | ({
      type: ActionType.DATA_CHANGED;
    } & DataChangedPayload)
  | ({
      type: ActionType.DEFINITION_AND_DATA_SUBMISSION_RESPONSE;
    } & UpdateDefinitionAndData)
  | {
      type: ActionType.DISMISS_SUBMISSION_RESPONSE_MESSAGE;
    }
  | ({
      type: ActionType.DATA_OBJECTS_SUBMISSION_RESPONSE;
    } & UpdateDataObjects)
  | {
      type: ActionType.OTHER_ERRORS;
      error?: string;
    }
  | ({
      type: ActionType.APOLLO_ERRORS;
    } & ApolloErrorsPayload);

interface SubmittingPayload {
  hasConnection: LayoutContextValue["hasConnection"];
}

interface ApolloErrorsPayload {
  errors: ApolloError;
}

interface OnlineEntryCreatedPayload {
  serverResult: CreateOnlineEntryMutation_createEntry;
}

interface DataChangedPayload {
  id: string;
  rawFormVal: FormObjVal;
}

interface DefinitionNameChangedPayload {
  id: string;
  formValue: string;
}

interface DefinitionFormErrorsPayload {
  ids: string[];
}

export type ComponentProps = UpdateDefinitionsOnlineMutationComponentProps &
  UpdateDataObjectsOnlineMutationComponentProps &
  UpdateDefinitionsAndDataOnlineMutationComponentProps &
  CallerProps &
  CreateOnlineEntryMutationComponentProps &
  CreateOfflineEntryMutationComponentProps & {
    client: ApolloClient<{}>;
    persistor: AppPersistor;
    cache: InMemoryCache;
    layoutDispatch: LayoutDispatchType;
    hasConnection: LayoutContextValue["hasConnection"];
  };

export interface CallerProps {
  entry: EntryFragment;
  experience: ExperienceFragment;
  dispatch: DispatchType;
}

export type DefinitionFormValue = Pick<
  DataDefinitionFragment,
  Exclude<keyof DataDefinitionFragment, "__typename" | "clientId" | "type">
>;

export interface FormValues {
  definitions: DefinitionFormValue[];
}

export type DispatchType = Dispatch<Action>;

export interface DefinitionsStates {
  [k: string]: DefinitionState;
}

export type DefinitionState = {
  context: {
    defaults: DataDefinitionFragment;
  };
} & (DefinitionIdleState | DefinitionEditingState);

interface DefinitionIdleState {
  value: "idle";

  idle: {
    context: {
      anyEditSuccess?: true;
    };
  };
}

interface DefinitionEditingState {
  value: "editing";

  editing: (
    | {
        value: "unchanged";
      }
    | DefinitionChangedState
  ) & {
    context: {
      formValue: string;
    };
  };
}

export interface DefinitionChangedState {
  value: "changed";

  changed:
    | {
        value: "regular";
      }
    | {
        value: "submitting";
      }
    | {
        value: "formErrors";
        context: {
          errors: {
            name: string;
          };
        };
      }
    | {
        value: "serverErrors";
        context: {
          errors: UpdateDefinitions_updateDefinitions_definitions_errors_errors;
        };
      };
}

interface IdString {
  id: string;
}

export interface DataStates {
  [k: string]: DataState;
}

export type DataState = {
  context: {
    defaults: DataObjectFragment & {
      parsedVal: FormObjVal;
      type: DataTypes;
    };
  };
} & (DataUnchangedState | DataChangedState);

interface DataUnchangedState {
  value: "unchanged";
  unchanged: {
    context: {
      anyEditSuccess?: true;
    };
  };
}

interface DataChangedState {
  value: "changed";

  changed: {
    context: {
      formValue: FormObjVal;
      formValueString: string;
    };
  } & (
    | {
        value: "normal";
      }
    | {
        value: "formErrors";
        context: {
          errors: {};
        };
      }
    | DataServerErrorsState
  );
}

interface DataServerErrorsState {
  value: "serverErrors";

  serverErrors: {
    context: {
      errors: UpdateDataObjects_updateDataObjects_fieldErrors;
    };
  };
}

interface UpdateWithDefinitionsSubmissionResponse {
  key: "definitions";
  definitionsResults: UpdateDefinitions;
}

interface UpdateWithDataObjectsSubmissionResponse {
  key: "dataObjects";
  dataObjectsResults: UpdateDataObjects;
}

interface UpdateWithDefinitionsAndDataObjectsSubmissionResponse {
  key: "definitions and dataObjects";
  definitionsResults: UpdateDefinitions;
  dataObjectsResults: UpdateDataObjects;
}

interface UpdateWithDataObjectsSubmissionResponse {
  key: "dataObjects";
  dataObjectsResults: UpdateDataObjects;
}

interface UpdateWithOnlineEntrySubmissionResponse {
  key: "onlineEntry";
  onlineEntryResults: CreateOnlineEntryMutation_createEntry;
}

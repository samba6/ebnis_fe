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
} from "../../graphql/update-definition-and-data.mutation";
import { editEntryUpdate } from "./edit-entry.injectables";
import { CreateOnlineEntryMutationComponentProps } from "../../graphql/create-entry.mutation";
import { isOfflineId, makeApolloCacheRef } from "../../constants";
import {
  CreateOnlineEntryMutation_createEntry,
  CreateOnlineEntryMutation_createEntry_errors_dataObjectsErrors,
  CreateOnlineEntryMutation_createEntry_errors,
} from "../../graphql/apollo-types/CreateOnlineEntryMutation";
import { AppPersistor } from "../../context";
import { InMemoryCache } from "apollo-cache-inmemory";
import { LayoutDispatchType, LayoutContextValue } from "../Layout/layout.utils";
import { CreateOfflineEntryMutationComponentProps } from "../NewEntry/new-entry.resolvers";
import {
  upsertExperienceWithEntry,
  UpsertExperienceInCacheMode,
} from "../NewEntry/new-entry.injectables";
import { wipeReferencesFromCache } from "../../state/resolvers/delete-references-from-cache";
import { ENTRY_TYPE_NAME, DATA_OBJECT_TYPE_NAME } from "../../graphql/types";
import { scrollIntoView } from "../scroll-into-view";
import { scrollToTopId } from "./edit-entry-dom";

export enum ActionType {
  EDIT_BTN_CLICKED = "@component/edit-entry/edit-btn-clicked",
  DEFINITION_NAME_CHANGED = "@component/edit-entry/definition-name-changed",
  UNDO_DEFINITION_EDITS = "@component/edit-entry/undo-definition-edits",
  STOP_DEFINITION_EDIT = "@component/edit-entry/stop-definition-edit",
  SUBMITTING = "@component/edit-entry/submitting",
  DESTROYED = "@component/edit-entry/destroy",
  DEFINITIONS_SUBMISSION_RESPONSE = "@component/edit-entry/definitions-submission-response",
  DATA_OBJECTS_ONLINE_SUBMISSION_RESPONSE = "@component/edit-entry/data-objects-submission-response",
  DEFINITION_FORM_ERRORS = "@component/edit-entry/definition-form-errors",
  DATA_CHANGED = "@component/edit-entry/data-changed",
  DEFINITION_AND_DATA_SUBMISSION_RESPONSE = "@component/edit-entry/submission-response",
  DISMISS_SUBMISSION_RESPONSE_MESSAGE = "@component/edit-entry/dismiss-submission-response-message",
  OTHER_ERRORS = "@component/edit-entry/other-errors",
  APOLLO_ERRORS = "@component/edit-entry/apollo-errors",
  ON_CREATE_ENTRY_ERRORS = "@component/edit-entry/online-entry-created",
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
  modifiedOffline: "modifiedOffline" as ModifiedOfflineVal,
};

export function initState(props: ComponentProps): StateMachine {
  const { entry, experience, hasConnection } = props;
  const { id: entryId, modOffline } = entry;

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
      general: {
        value: StateValue.noEffect,
      },
    },
    context: {
      lenDefinitions,
      definitionAndDataIdsMapList,
      entry,
      hasConnection,
    },
    states: {
      mode: {
        value: isOfflineId(entryId)
          ? StateValue.offline
          : modOffline === true
          ? StateValue.modifiedOffline
          : StateValue.online,
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
}

export const reducer: Reducer<StateMachine, Action> = (state, action) =>
  wrapReducer<StateMachine, Action>(
    state,
    action,
    (prevState, { type, ...payload }) => {
      return immer(prevState, proxy => {
        proxy.effects.general.value = StateValue.noEffect;
        delete proxy.effects.general[StateValue.hasEffects];

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
            prepareSubmissionOnlineResponse(proxy, {
              key: "definitions",
              definitionsResults: payload as UpdateDefinitions,
            });
            break;

          case ActionType.DATA_OBJECTS_ONLINE_SUBMISSION_RESPONSE:
            prepareSubmissionOnlineResponse(proxy, {
              key: "dataObjects",
              dataObjectsResults: payload as UpdateDataObjects,
            });
            break;

          case ActionType.ON_CREATE_ENTRY_ERRORS:
            prepareSubmissionOnlineResponse(proxy, {
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

const createEntryEffect: CreateEntryEffect["func"] = async (
  { input },
  { createOfflineEntry, createOnlineEntry, persistor, cache },
  { dispatch },
) => {
  try {
    const validResponse = await createEntryEffectHelper(
      {
        input,
        onDone: () => {
          const { clientId, dataObjects } = input;

          wipeReferencesFromCache(
            cache,
            [makeApolloCacheRef(ENTRY_TYPE_NAME, clientId as string)].concat(
              dataObjects.map(d => {
                const dobj = d as DataObjectFragment;

                return makeApolloCacheRef(
                  DATA_OBJECT_TYPE_NAME,
                  dobj.clientId as string,
                );
              }),
            ),
          );

          persistor.persist();
        },
      },
      { createOfflineEntry, createOnlineEntry },
    );

    const { entry, errors } = validResponse;

    // We only deal with error state because on success with no errors, apollo
    // will cause React lib to unmount this component. So if we try any update
    // to state, react will complain:
    // Warning: Can't perform a React state update on an unmounted component.
    // This is the reason upsertExperienceWithEntry needs to take an onDone
    // callback
    if (errors) {
      persistor.persist();
      dispatch({
        type: ActionType.ON_CREATE_ENTRY_ERRORS,
        serverResult: errors,
      });

      return;
    }

    if (!entry) {
      dispatch({
        type: ActionType.OTHER_ERRORS,
      });
    }
  } catch (errors) {
    dispatch({
      type: ActionType.OTHER_ERRORS,
      error: interpretCreateEntryMutationException(errors),
    });
  }
};

type CreateEntryEffect = EffectDefinition<
  "createEntryEffect",
  {
    input: CreateEntryInput;
  }
>;

const updateEntryInCacheEffect: UpdateEntryInCacheEffect["func"] = async (
  { entry, upsertMode },
  { client, persistor },
) => {
  const { experienceId } = entry;

  (await upsertExperienceWithEntry(experienceId, upsertMode)(client, {
    data: { createEntry: { entry } as CreateOnlineEntryMutation_createEntry },
  })) as ExperienceFragment;

  await persistor.persist();
};

type UpdateEntryInCacheEffect = EffectDefinition<
  "updateEntryInCacheEffect",
  {
    entry: EntryFragment;
    upsertMode: UpsertExperienceInCacheMode;
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
  "definitionsFormErrorsEffect",
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
      // update: editEntryUpdate(entry),
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
  "updateDefinitionsOnlineEffect",
  {
    experienceId: string;
    definitionsInput: UpdateDefinitionInput[];
  }
>;

const updateDataObjectsOnlineEffect: UpdateDataObjectsOnlineEffect["func"] = async (
  { dataInput },
  { updateDataObjectsOnline, entry },
  { dispatch },
) => {
  try {
    const response = await updateDataObjectsOnline({
      variables: {
        input: dataInput,
      },

      update: editEntryUpdate(entry),
    });

    const successResult = response && response.data;

    if (successResult) {
      dispatch({
        type: ActionType.DATA_OBJECTS_ONLINE_SUBMISSION_RESPONSE,
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
  "updateDataObjectsOnlineEffect",
  {
    dataInput: UpdateDataObjectInput[];
  }
>;

const updateDefinitionsAndDataOnlineEffect: UpdateDefinitionsAndDataOnlineEffect["func"] = async (
  { experienceId, definitionsInput, dataInput },
  { updateDefinitionsAndDataOnline, entry },
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
      update: editEntryUpdate(entry),
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
  "updateDefinitionsAndDataOnlineEffect",
  {
    dataInput: UpdateDataObjectInput[];
    experienceId: string;
    definitionsInput: UpdateDefinitionInput[];
  }
>;

const scrollToViewEffect: ScrollToViewEffect["func"] = ({ id }) => {
  scrollIntoView(id, {
    behavior: "smooth",
  });
};

type ScrollToViewEffect = EffectDefinition<
  "scrollToViewEffect",
  {
    id: string;
  }
>;

export const effectFunctions = {
  updateDefinitionsAndDataOnlineEffect,
  updateDataObjectsOnlineEffect,
  updateDefinitionsOnlineEffect,
  definitionsFormErrorsEffect,
  createEntryEffect,
  updateEntryInCacheEffect,
  scrollToViewEffect,
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
  const { hasConnection } = payload;

  if (!hasConnection) {
    // only edit
    handleUpdateEntryOfflineAction(proxy);
    return;
  }

  if (proxy.states.mode.value === StateValue.offline) {
    handleCreateEntryAction(proxy);
    return;
  }

  handleSubmittingUpdateDataAndOrDefinitionAction(proxy);
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

  prepareSubmissionOnlineResponse(proxy, {
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
  errors: CreateOnlineEntryMutation_createEntry_errors,
) {
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

function getGeneralEffects(proxy: DraftState) {
  const generalEffects = proxy.effects.general as EffectState;
  generalEffects.value = StateValue.hasEffects;
  let effects: EffectsList = [];

  if (!generalEffects.hasEffects) {
    generalEffects.hasEffects = {
      context: {
        effects,
      },
    };
  } else {
    effects = generalEffects.hasEffects.context.effects;
  }

  return effects;
}

function prepareSubmissionOnlineResponse(
  proxy: DraftState,
  payload:
    | UpdateWithDefinitionsAndDataObjectsSubmissionResponse
    | UpdateWithDefinitionsSubmissionResponse
    | UpdateWithDataObjectsSubmissionResponse
    | UpdateWithCreateEntrySubmissionResponse,
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
    const [s, f, t] = handleDataObjectsOnlineSubmissionResponseAction(
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

  const effects = getGeneralEffects(proxy);
  effects.push({
    key: "scrollToViewEffect",
    ownArgs: {
      id: scrollToTopId,
    },
  });
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
): DataObjectFragment {
  dataState.context.defaults = {
    ...dataState.context.defaults,
    ...dataObject,
  };

  dataState.context.defaults.parsedVal = formObjFromRawString(dataObject.data);

  const unchangedState = (dataState as unknown) as DataUnchangedState;
  unchangedState.value = "unchanged";
  unchangedState.unchanged.context.anyEditSuccess = true;

  return dataState.context.defaults;
}

function handleDataObjectsOnlineSubmissionResponseAction(
  proxy: DraftState,
  context: SubmissionSuccessStateContext,
  updateDataObjectsResults: UpdateDataObjects,
) {
  const dataObjectsResults =
    updateDataObjectsResults && updateDataObjectsResults.updateDataObjects;

  if (!dataObjectsResults) {
    (context.invalidResponse as SubmissionInvalidResponse).data =
      "unable to update data: unknown error occurred";

    return [0, 0];
  }

  let successCount = 0;
  let failureCount = 0;

  const {
    states: { dataStates, mode },
    context: { entry },
  } = proxy;

  const idToPreviousDataObjectMap = entry.dataObjects.reduce((acc, d) => {
    const data = d as DataObjectFragment;
    acc[data.id] = data;
    return acc;
  }, {} as { [k: string]: DataObjectFragment });

  dataObjectsResults.forEach(obj => {
    const {
      id,
      dataObject,
      stringError,
      fieldErrors,
    } = obj as UpdateDataObjects_updateDataObjects;

    const dataState = dataStates[id];

    if (dataObject) {
      updateDataStateWithUpdatedDataObject(dataState, dataObject);

      const { id } = dataObject;

      idToPreviousDataObjectMap[id] = {
        ...idToPreviousDataObjectMap[id],
        ...dataObject,
      };

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

  entry.dataObjects = Object.values(idToPreviousDataObjectMap);
  const modeState = mode;

  if (modeState.value === StateValue.modifiedOffline) {
    entry.modOffline = null;
    proxy.context.entry = entry;
    mode.value = StateValue.online;
    const effects = getGeneralEffects(proxy);
    effects.push({
      key: "updateEntryInCacheEffect",
      ownArgs: { entry, upsertMode: "online" },
    });
  }

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

async function handleSubmittingUpdateDataAndOrDefinitionAction(
  proxy: DraftState,
) {
  const { states } = proxy;
  const effects = getGeneralEffects(proxy);
  const [definitionsInput, definitionsWithFormErrors] = getDefinitionsToSubmit(
    states.definitionsStates,
  ) as [UpdateDefinitionInput[], string[]];

  const [dataInput] = getDataObjectsForOnlineUpdate(proxy);

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
    effects.push({
      key: "definitionsFormErrorsEffect",
      ownArgs: {
        definitionsWithFormErrors,
      },
    });

    return;
  }

  const {
    entry: { experienceId },
  } = proxy.context;

  if (dataInput.length === 0) {
    effects.push({
      key: "updateDefinitionsOnlineEffect",
      ownArgs: {
        definitionsInput,
        experienceId,
      },
    });

    return;
  }

  if (definitionsInput.length === 0) {
    effects.push({
      key: "updateDataObjectsOnlineEffect",
      ownArgs: {
        dataInput,
      },
    });

    return;
  }

  effects.push({
    key: "updateDefinitionsAndDataOnlineEffect",
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

function handleCreateEntryAction(proxy: DraftState) {
  const {
    states,
    context: { entry },
  } = proxy;

  const { experienceId } = entry;

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

  const effects = getGeneralEffects(proxy);
  const { updatedAt, insertedAt, clientId } = entry;

  effects.push({
    key: "createEntryEffect",
    ownArgs: {
      input: {
        dataObjects,
        experienceId,
        clientId,
        updatedAt,
        insertedAt,
      },
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
        context: { defaults },
        changed: {
          context: { formValue },
        },
      } = dataState;

      const { type } = defaults;
      obj.data = makeDataObjectData(type, formValue);
      obj.updatedAt = updateTime;
      d.value = "unchanged";
      defaults.parsedVal = formValue;

      (d as DataUnchangedState).unchanged.context.anyEditSuccess = true;

      ++updatedCount;
    }
  });

  return updatedCount;
}

function getDataObjectsForOnlineUpdate(proxy: DraftState) {
  const {
    states: { dataStates, mode },
  } = proxy;

  const inputs: UpdateDataObjectInput[] = [];

  for (const [id, dataState] of Object.entries(dataStates)) {
    const {
      context: {
        defaults: { type, parsedVal },
      },
    } = dataState;

    if (dataState.value === "changed") {
      const {
        changed: {
          context: { formValue },
        },
      } = dataState;

      inputs.push({
        id,
        data: makeDataObjectData(type, formValue),
      });
    } else if (mode.value === StateValue.modifiedOffline) {
      inputs.push({
        id,
        data: makeDataObjectData(type, parsedVal),
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

function handleUpdateEntryOfflineAction(proxy: DraftState) {
  const {
    states,
    context: { entry },
  } = proxy;

  const updateTime = new Date().toJSON();
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
  let effects = getGeneralEffects(proxy);

  effects.push({
    key: "updateEntryInCacheEffect",
    ownArgs: {
      entry,
      upsertMode: "offline",
    },
  });

  effects = getGeneralEffects(proxy);
  effects.push({
    key: "scrollToViewEffect",
    ownArgs: {
      id: scrollToTopId,
    },
  });
}

////////////////////// END STATE UPDATE FUNCTIONS SECTION ///////////////////

export const EditEnryContext = createContext<ContextValue>({} as ContextValue);

////////////////////////// TYPES SECTION ////////////////////////

type DraftState = Draft<StateMachine>;

export interface StateMachine {
  readonly context: {
    readonly lenDefinitions: number;
    readonly definitionAndDataIdsMapList: DefinitionAndDataIds[];
    readonly entry: EntryFragment;
    readonly hasConnection: LayoutContextValue["hasConnection"];
  };
  readonly effects: {
    general: EffectState | { value: NoEffectVal };
  };
  states: {
    readonly mode:
      | { value: OfflineVal }
      | { value: OnlineVal }
      | { value: ModifiedOfflineVal };
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
type ModifiedOfflineVal = "modifiedOffline";
////////////////////////// END STRINGGY TYPES SECTION //////////////////

interface ContextValue {
  dispatch: DispatchType;
  onSubmit: () => void;
  hasConnection: LayoutContextValue["hasConnection"];
}

interface GeneralEffectState<IEffect> {
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
  | UpdateEntryInCacheEffect
  | ScrollToViewEffect
)[];

interface EffectFunctionArgs {
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
    lastArgs: EffectFunctionArgs,
  ) => void | Promise<void | (() => void)> | (() => void);
}

interface DefinitionAndDataIds {
  definitionId: string;
  dataId: string;
}

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
      type: ActionType.ON_CREATE_ENTRY_ERRORS;
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
      type: ActionType.DATA_OBJECTS_ONLINE_SUBMISSION_RESPONSE;
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
  serverResult: CreateOnlineEntryMutation_createEntry_errors;
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

interface UpdateWithCreateEntrySubmissionResponse {
  key: "onlineEntry";
  onlineEntryResults: CreateOnlineEntryMutation_createEntry_errors;
}

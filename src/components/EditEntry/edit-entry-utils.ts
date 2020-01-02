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
} from "../NewEntry/new-entry.utils";
import parseISO from "date-fns/parseISO";
import parse from "date-fns/parse";
import {
  UpdateDataObjectsOnlineMutationComponentProps,
  UpdateDefinitionsOnlineMutationComponentProps,
  UpdateDefinitionsAndDataOnlineMutationComponentProps,
  editEntryUpdate,
} from "./edit-entry.injectables";
import {
  CreateOnlineEntryMutationComponentProps,
} from "../../graphql/create-entry.mutation";
import { isOfflineId } from "../../constants";
import { updateExperienceWithNewEntry } from "../NewEntry/new-entry.injectables";
import {
  CreateOnlineEntryMutation_createEntry,
  CreateOnlineEntryMutation_createEntry_errors_dataObjectsErrors,
} from "../../graphql/apollo-types/CreateOnlineEntryMutation";
import { decrementOfflineEntriesCountForExperience } from "../../apollo-cache/drecrement-offline-entries-count";
import { AppPersistor } from "../../context";
import { InMemoryCache } from "apollo-cache-inmemory";
import { LayoutDispatchType, LayoutActionType } from "../Layout/layout.utils";

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
  ONLINE_ENTRY_CREATED = "@component/edit-entry/online-entry-created",
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
};

export const initStateFromProps = (
  props: EditEntryComponentProps,
): StateMachine => {
  const { entry, experience } = props;

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
      experienceId: experience.id,
      entry,
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
            setDefinitionEditingUnchangedState(proxy, (payload as IdString).id);
            break;

          case ActionType.UNDO_DEFINITION_EDITS:
            handleUndoDefinitionEdits(proxy, payload as IdString);
            break;

          case ActionType.STOP_DEFINITION_EDIT:
            handleStopDefinitionEdit(proxy, payload as IdString);
            break;

          case ActionType.SUBMITTING:
            handleSubmittingAction(proxy);
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

          case ActionType.ONLINE_ENTRY_CREATED:
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
            proxy.submission.value = StateValue.inactive;
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

const createEntryOnlineEffect: CreateEntryOnlineEffect["func"] = async (
  { input },
  { createOnlineEntry },
  { dispatch },
) => {
  try {
    const response = await createOnlineEntry({
      variables: {
        input,
      },
      update: updateExperienceWithNewEntry(input.experienceId),
    });

    const validResponse =
      response && response.data && response.data.createEntry;

    if (validResponse) {
      dispatch({
        type: ActionType.ONLINE_ENTRY_CREATED,
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

type CreateEntryOnlineEffect = EffectDefinition<
  "createOnlineEntry",
  {
    input: CreateEntryInput;
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
  createOnlineEntry: createEntryOnlineEffect,
  decrementOfflineEntriesCount: decrementOfflineEntriesCountEffect,
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
  props: EditEntryComponentProps,
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
  const state = proxy.definitionsStates[id];
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
    setDefinitionEditingUnchangedState(proxy, id);
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

function handleSubmittingAction(proxy: DraftState) {
  proxy.submission.value = StateValue.submitting;
  const [effectObjects] = getRenderEffects(proxy);
  const { entry } = proxy.context;

  if (isOfflineId(entry.id)) {
    handleSubmittingCreateEntryOnlineAction(proxy, effectObjects);
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

  proxy.submission = {
    ...proxy.submission,
    ...primaryStateFormErrors,
  };

  const { ids } = payload as DefinitionFormErrorsPayload;

  const errors = {
    name: "should be at least 2 characters long.",
  };

  for (const id of ids) {
    const definitionState = proxy.definitionsStates[id];

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

  proxy.submission = {
    ...proxy.submission,
    ...otherErrorsState,
  };
}

function handleStopDefinitionEdit(proxy: DraftState, payload: IdString) {
  const { id } = payload as IdString;
  const { definitionsStates } = proxy;

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
  setDefinitionEditingUnchangedState(proxy, id);
  setEditingDefinitionState(proxy, id);
}

function handleDataChangedAction(
  proxy: DraftState,
  payload: DataChangedPayload,
) {
  const { dataStates } = proxy;
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

  proxy.submission = {
    ...proxy.submission,
    ...apolloErrorsState,
  };
}

function handleOnlineEntryCreatedServerResponseAction(
  proxy: DraftState,
  context: SubmissionSuccessStateContext,
  response: CreateOnlineEntryMutation_createEntry,
) {
  const [effectObjects] = getRenderEffects(proxy);
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
    const { dataStates } = proxy;

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
  const { dataStates } = proxy;
  const { context: globalContext } = proxy;

  globalContext.entry = entry;
  const definitionAndDataIdsMapList = globalContext.definitionAndDataIdsMapList;

  entry.dataObjects.forEach((obj, index) => {
    const dataObject = obj as DataObjectFragment;
    const { clientId, id: dataId, definitionId } = dataObject;
    const offlineId = clientId as string;
    const dataState = dataStates[offlineId];
    updateDataStateWithUpdatedDataObject(dataState, dataObject);
    dataStates[dataId] = dataState;
    delete dataStates[offlineId];

    definitionAndDataIdsMapList[index] = {
      definitionId,
      dataId,
    };
  });

  effectObjects.push({
    key: "decrementOfflineEntriesCount",
    ownArgs: { experienceId: entry.experienceId },
  });

  return [1, 0, "valid"];
}

function getRenderEffects(proxy: DraftState) {
  const runOnRendersEffects = proxy.effects.runOnRenders as EffectState;
  runOnRendersEffects.value = StateValue.hasEffects;
  const effectObjects: EffectsList = [];
  const cleanupEffectObjects: EffectsList = [];
  runOnRendersEffects.hasEffects = {
    context: {
      effects: effectObjects,
      cleanupEffects: cleanupEffectObjects,
    },
  };

  return [effectObjects, cleanupEffectObjects];
}

function prepareSubmissionResponse(
  proxy: DraftState,
  props:
    | UpdateWithDefinitionsAndDataObjectsSubmissionResponse
    | UpdateWithDefinitionsSubmissionResponse
    | UpdateWithDataObjectsSubmissionResponse
    | UpdateWithOnlineEntrySubmissionResponse,
) {
  const {
    submitting: {
      context: { submittedCount },
    },
  } = proxy.submission as Submitting;

  const submissionSuccessResponse = {
    value: "submissionSuccess",
  } as SubmissionSuccessState;

  const context = {
    invalidResponse: {},
  } as SubmissionSuccessStateContext;

  let successCount = 0;
  let failureCount = 0;

  let t1 = "valid";
  let t2 = "valid";
  let t3 = "valid";

  if (
    props.key === "dataObjects" ||
    props.key == "definitions and dataObjects"
  ) {
    const [s, f, t] = handleDataObjectSubmissionResponse(
      proxy,
      context,
      props.dataObjectsResults,
    ) as [number, number, string];

    successCount += s;
    failureCount += f;
    t1 = t;
  }

  if (
    props.key === "definitions" ||
    props.key === "definitions and dataObjects"
  ) {
    const [s, f, t] = handleDefinitionsSubmissionResponse(
      proxy,
      context,
      props.definitionsResults,
    ) as [number, number, string];

    successCount += s;
    failureCount += f;
    t2 = t;
  }

  if (props.key === "onlineEntry") {
    const [s, f, t] = handleOnlineEntryCreatedServerResponseAction(
      proxy,
      context,
      props.onlineEntryResults,
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

  submissionSuccessResponse.submissionSuccess = {
    context,
  };

  proxy.submission = {
    ...proxy.submission,
    ...submissionSuccessResponse,
    value: "submissionSuccess",
  };

  if (submittedCount === successCount) {
    proxy.editingData.value = StateValue.inactive;
  }

  return { submissionSuccessResponse, context };
}

function setDefinitionEditingUnchangedState(proxy: DraftState, id: string) {
  const { definitionsStates } = proxy;
  const state = definitionsStates[id];
  state.value = "editing";
  (state as DefinitionEditingState).editing = {
    value: "unchanged",

    context: {
      formValue: state.context.defaults.name,
    },
  };
  proxy.definitionsStates[id] = { ...definitionsStates[id], ...state };
}

function setEditingDefinitionState(
  proxy: DraftState,
  mostRecentlyInterractedWithDefinitionId: string,
) {
  let changedDefinitionsCount = 0;
  let previousMostRecentlyChangedDefinitionId = "";

  if (proxy.editingDefinition.value === StateValue.multiple) {
    previousMostRecentlyChangedDefinitionId =
      proxy.editingDefinition[StateValue.multiple].context
        .mostRecentlyChangedDefinitionId;
  }

  for (const [id, state] of Object.entries(proxy.definitionsStates)) {
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
    proxy.editingDefinition.value = StateValue.inactive;
  } else if (changedDefinitionsCount === 1) {
    proxy.editingDefinition.value = StateValue.single;
  } else {
    (proxy.editingDefinition as EditingMultipleDefinitionsState) = {
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
  const { dataStates } = proxy;

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

  const { definitionsStates } = proxy;
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
  const [definitionsInput, definitionsWithFormErrors] = getDefinitionsToSubmit(
    proxy.definitionsStates,
  ) as [UpdateDefinitionInput[], string[]];

  const [dataInput] = getDataObjectsToSubmit(proxy.dataStates);

  proxy.submission = {
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

  const { experienceId } = proxy.context;

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

  for (const state of Object.values(proxy.dataStates)) {
    if (state.value === "changed") {
      ++dataChangedCount;
    }
  }

  if (dataChangedCount === 0) {
    proxy.editingData.value = StateValue.inactive;
  } else {
    proxy.editingData.value = StateValue.active;
  }
}

function handleSubmittingCreateEntryOnlineAction(
  proxy: DraftState,
  effectObjects: EffectsList,
) {
  proxy.submission = {
    value: StateValue.submitting,
    submitting: {
      context: {
        submittedCount: 1,
      },
    },
  };

  const {
    context: { experienceId, entry },
    dataStates,
  } = proxy;

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
    key: "createOnlineEntry",
    ownArgs: {
      input: {
        dataObjects,
        experienceId,
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

function getDataObjectsToSubmit(dataStates: DataStates) {
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

////////////////////// END STATE UPDATE FUNCTIONS SECTION ///////////////////

export const EditEnryContext = createContext<ContextValue>({} as ContextValue);

////////////////////////// TYPES ////////////////////////////

interface ContextValue {
  dispatch: DispatchType;
}

type DraftState = Draft<StateMachine>;

export interface StateMachine extends StateMachineContext {
  readonly dataStates: DataStates;
  readonly definitionsStates: DefinitionsStates;
  readonly effects: {
    runOnRenders: EffectState | { value: NoEffectVal };
  };
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
      cleanupEffects: EffectsList;
    };
  };
}

type EffectsList = (
  | UpdateDefinitionsOnlineEffect
  | CreateEntryOnlineEffect
  | DefinitionsFormErrorsEffect
  | UpdateDataObjectsOnlineEffect
  | UpdateDefinitionsAndDataOnlineEffect
  | DecrementOfflineEntriesCountEffect
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
    effectArgs: EditEntryComponentProps,
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
////////////////////////// END STRINGGY TYPES SECTION //////////////////

interface StateMachineContext {
  context: {
    lenDefinitions: number;
    definitionAndDataIdsMapList: DefinitionAndDataIds[];
    experienceId: string;
    entry: EntryFragment;
  };
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
      type: ActionType.ONLINE_ENTRY_CREATED;
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
  | {
      type: ActionType.SUBMITTING;
    }
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

export type EditEntryComponentProps = UpdateDefinitionsOnlineMutationComponentProps &
  UpdateDataObjectsOnlineMutationComponentProps &
  UpdateDefinitionsAndDataOnlineMutationComponentProps &
  EditEntryCallerProps &
  CreateOnlineEntryMutationComponentProps & {
    client: ApolloClient<{}>;
    persistor: AppPersistor;
    cache: InMemoryCache;
    layoutDispatch: LayoutDispatchType;
  };

export interface EditEntryCallerProps {
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

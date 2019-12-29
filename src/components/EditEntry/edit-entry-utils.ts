import { EntryFragment } from "../../graphql/apollo-types/EntryFragment";
import { DataDefinitionFragment } from "../../graphql/apollo-types/DataDefinitionFragment";
import { Dispatch, Reducer, createContext } from "react";
import immer from "immer";
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
import { ApolloError } from "apollo-client";
import { formObjToString, ISO_DATE_FORMAT } from "../NewEntry/new-entry.utils";
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
import { updateExperienceWithNewEntry } from "../NewEntry/new-entry.injectables";
import { CreateOnlineEntryMutation_createEntry } from "../../graphql/apollo-types/CreateOnlineEntryMutation";
import {
  DecrementOfflineEntriesCountForExperienceArgs,
  decrementOfflineEntriesCountForExperience,
} from "../../state/resolvers/update-experiences-in-cache";

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
  PUT_EFFECT_META_FUNCTIONS = "@component/edit-entry/put-effect-meta-functions",
}

export const EFFECT_VALUE_NO_EFFECT: EffectValueNoEffect = "noEffect";
export const EFFECT_VALUE_HAS_EFFECTS: EffectValueHasEffects = "hasEffects";

export const EDITING_DEFINITION_INACTIVE: EditingDefinitionInactive =
  "inactive";
export const EDITING_DEFINITION_SINGLE: EditingDefinitionSingle = "single";
export const EDITING_DEFINITION_MULTIPLE: EditingDefinitionMultiple =
  "multiple";

export const EDITING_DATA_ACTIVE: EditingDataActive = "active";
export const EDITING_DATA_INACTIVE: EditingDataInactive = "inactive";

export const initStateFromProps = (
  props: EditEntryComponentProps,
): IStateMachine => {
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

  const definitionsStates = definitions.reduce(
    (acc, definition) => {
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
    },
    {} as DefinitionsStates,
  );

  if (definitionAndDataIdsMapList.length === 0) {
    dataIds.forEach(id =>
      definitionAndDataIdsMapList.push({
        dataId: id,
      } as DefinitionAndDataIds),
    );
  }

  const state = {
    effects: {
      value: EFFECT_VALUE_NO_EFFECT,
      context: {
        metaFunctions: {} as PutEffectMetaFunctionsPayload,
      },
    },

    primaryState: {
      context: {
        lenDefinitions,
        definitionAndDataIdsMapList,
        experienceId: experience.id,
        entry,
      },

      common: {
        value: "editing" as "editing",
      },

      editingData: {
        value: EDITING_DATA_INACTIVE,
      },

      editingDefinition: {
        value: EDITING_DEFINITION_INACTIVE,
      },

      submissionResponse: {
        value: "inactive" as "inactive",
      },
    },

    definitionsStates,

    dataStates,
  };

  return state;
};

export const reducer: Reducer<IStateMachine, Action> = (state, action) =>
  wrapReducer<IStateMachine, Action>(
    state,
    action,
    (prevState, { type, ...payload }) => {
      return immer(prevState, proxy => {
        proxy.effects.value = EFFECT_VALUE_NO_EFFECT;

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
            handleOtherErrorsAction(proxy);
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
            (proxy.primaryState
              .submissionResponse as SubmissionResponseState).value =
              "inactive";
            break;
        }
      });
    },

    // true,
  );

////////////////////////// REDUCER STATE UPDATE FUNCTIONS //////////////////
// you can write to state, but can not use dispatch - every call to dispatch
// must be put inside a function and added to effects

function handleDefinitionNameChangedAction(
  globalState: IStateMachine,
  payload: DefinitionNameChangedPayload,
) {
  const { id, formValue } = payload;
  const state = globalState.definitionsStates[id];
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
    setDefinitionEditingUnchangedState(globalState, id);
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

  setEditingDefinitionState(globalState, id);
}

function handleSubmittingAction(
  globalState: IStateMachine,
  payload: SubmittingPayload,
) {
  globalState.primaryState.common.value = "submitting";

  const userPayload = payload as SubmittingPayload;

  const effectObjects = prepareToAddEffect(globalState);

  const { entry } = globalState.primaryState.context;

  if (isOfflineId(entry.id)) {
    handleSubmittingCreateEntryOnlineAction(
      globalState,
      userPayload,
      effectObjects,
    );
    return;
  }

  handleSubmittingUpdateDataAndOrDefinitionAction({
    payload: userPayload,
    globalState: globalState,
    effectObjects,
  });
}

function handleDefinitionFormErrorsAction(
  proxy: IStateMachine,
  payload: DefinitionFormErrorsPayload,
) {
  const { primaryState } = proxy;
  primaryState.common.value = "editing";

  const primaryStateFormErrors = {
    isActive: true,
    value: "formErrors",
    formErrors: {
      context: {
        errors: "please correct the highlighted errors and resubmit",
      },
    },
  } as SubmissionResponseState;

  primaryState.submissionResponse = {
    ...primaryState.submissionResponse,
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

function handleOtherErrorsAction(proxy: IStateMachine) {
  const { primaryState } = proxy;
  primaryState.common.value = "editing";

  const otherErrorsState = {
    isActive: true,
    value: "otherErrors",
    otherErrors: {
      context: {
        errors: "We apologize, we are unable to fulfill your request this time",
      },
    },
  } as SubmissionResponseState;

  primaryState.submissionResponse = {
    ...primaryState.submissionResponse,
    ...otherErrorsState,
  };
}

function handleStopDefinitionEdit(proxy: IStateMachine, payload: IdString) {
  const { id } = payload as IdString;
  const { definitionsStates } = proxy;

  definitionsStates[id].value = "idle";

  setEditingDefinitionState(proxy, id);
}

function handleDefinitionAndDataSubmissionResponse(
  proxy: IStateMachine,
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

function handleUndoDefinitionEdits(proxy: IStateMachine, payload: IdString) {
  const { id } = payload as IdString;
  setDefinitionEditingUnchangedState(proxy, id);
  setEditingDefinitionState(proxy, id);
}

function handleDataChangedAction(
  proxy: IStateMachine,
  payload: DataChangedPayload,
) {
  const { dataStates } = proxy;
  const { id, rawFormVal } = payload as DataChangedPayload;
  const state = dataStates[id];
  let { parsedVal, type } = state.context.defaults;

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
  proxy: IStateMachine,
  payload: ApolloErrorsPayload,
) {
  const { primaryState } = proxy;
  primaryState.common.value = "editing";
  const {
    errors: { graphQLErrors, networkError },
  } = payload as ApolloErrorsPayload;

  const apolloErrorsState = {
    isActive: true,
    value: "apolloErrors",
    apolloErrors: {
      context: {
        errors: networkError ? networkError.message : graphQLErrors[0].message,
      },
    },
  } as SubmissionResponseState;

  primaryState.submissionResponse = {
    ...primaryState.submissionResponse,
    ...apolloErrorsState,
  };
}

function handleOnlineEntryCreatedServerResponseAction(
  globalState: IStateMachine,
  response: CreateOnlineEntryMutation_createEntry,
) {
  // const effectObjects = handlePrepareToAddEffect(globalState);

  const { entry } = response;

  if (!entry) {
    return [0, 0];
  }

  const { dataStates } = globalState;
  const {
    primaryState: { context: globalContext },
  } = globalState;

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

  // effectObjects.push({
  //   key: "decrementOfflineEntriesCount",
  //   func: decrementOfflineEntriesCountEffectFn,
  //   args: {} as DecrementOfflineEntriesCountForExperienceArgs,
  // });

  return [1, 0, "valid"];
}

function prepareToAddEffect(globalState: IStateMachine) {
  const effects = (globalState.effects as unknown) as EffectState;
  effects.value = EFFECT_VALUE_HAS_EFFECTS;
  const effectObjects: EffectObject = [];
  effects[EFFECT_VALUE_HAS_EFFECTS] = {
    context: {
      effects: effectObjects,
    },
  };

  return effectObjects;
}

function prepareSubmissionResponse(
  proxy: IStateMachine,
  props:
    | UpdateWithDefinitionsAndDataObjectsSubmissionResponse
    | UpdateWithDefinitionsSubmissionResponse
    | UpdateWithDataObjectsSubmissionResponse
    | UpdateWithOnlineEntrySubmissionResponse,
) {
  const { primaryState } = proxy;
  primaryState.common.value = "editing";

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
    let [s, f, t] = handleDataObjectSubmissionResponse(
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

  primaryState.submissionResponse = {
    ...primaryState.submissionResponse,
    ...submissionSuccessResponse,
    value: "submissionSuccess",
  };

  const {
    submitting: {
      context: { submittedCount },
    },
  } = primaryState.common as PrimaryStateSubmitting;

  if (submittedCount === successCount) {
    primaryState.editingData.value = EDITING_DATA_INACTIVE;
  }

  return { primaryState, submissionSuccessResponse, context };
}

function setDefinitionEditingUnchangedState(proxy: IStateMachine, id: string) {
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
  proxy: IStateMachine,
  mostRecentlyInterractedWithDefinitionId: string,
) {
  const { primaryState } = proxy;
  let changedDefinitionsCount = 0;
  let previousMostRecentlyChangedDefinitionId = "";

  if (primaryState.editingDefinition.value === EDITING_DEFINITION_MULTIPLE) {
    previousMostRecentlyChangedDefinitionId =
      primaryState.editingDefinition[EDITING_DEFINITION_MULTIPLE].context
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
    primaryState.editingDefinition.value = EDITING_DEFINITION_INACTIVE;
  } else if (changedDefinitionsCount === 1) {
    primaryState.editingDefinition.value = EDITING_DEFINITION_SINGLE;
  } else {
    (primaryState.editingDefinition as EditingMultipleDefinitionsState) = {
      value: EDITING_DEFINITION_MULTIPLE,
      [EDITING_DEFINITION_MULTIPLE]: {
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
  proxy: IStateMachine,
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
  globalState: IStateMachine,
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

  const { definitionsStates } = globalState;
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
  payload,
  globalState,
  effectObjects,
}: {
  globalState: IStateMachine;
  payload: SubmittingPayload;
  effectObjects: EffectObject;
}) {
  const {
    updateDefinitionsOnline,
    updateDefinitionsAndDataOnline,
    updateDataObjectsOnline,
    dispatch,
  } = payload;

  const [definitionsInput, definitionsWithFormErrors] = getDefinitionsToSubmit(
    globalState.definitionsStates,
  ) as [UpdateDefinitionInput[], string[]];

  const [dataInput] = getDataObjectsToSubmit(globalState.dataStates);

  (globalState.primaryState.common as PrimaryStateSubmitting).submitting = {
    context: {
      submittedCount:
        definitionsInput.length +
        definitionsWithFormErrors.length +
        dataInput.length,
    },
  };

  if (definitionsWithFormErrors.length !== 0) {
    effectObjects.push({
      key: "definitionsFormErrors",
      func: definitionsFormErrorsEffectFn,
      args: {
        dispatch,
        definitionsWithFormErrors,
      },
    });

    return;
  }

  const { experienceId } = globalState.primaryState.context;

  if (dataInput.length === 0) {
    effectObjects.push({
      key: "updateDefinitionsOnline",
      func: updateDefinitionsOnlineEffectFn,
      args: {
        dispatch,
        updateDefinitionsOnline,
        definitionsInput,
        experienceId,
      },
    });

    return;
  }

  if (definitionsInput.length === 0) {
    effectObjects.push({
      key: "updateDataObjectsOnline",
      func: updateDataObjectsOnlineEffectFn,
      args: {
        dispatch,
        updateDataObjectsOnline,
        dataInput,
      },
    });

    return;
  }

  effectObjects.push({
    key: "updateDefinitionsAndDataOnline",
    func: updateDefinitionsAndDataOnlineEffectFn,
    args: {
      dispatch,
      updateDefinitionsAndDataOnline,
      experienceId,
      dataInput,
      definitionsInput,
    },
  });
}

function setEditingData(proxy: IStateMachine) {
  let dataChangedCount = 0;

  for (const state of Object.values(proxy.dataStates)) {
    if (state.value === "changed") {
      ++dataChangedCount;
    }
  }

  if (dataChangedCount !== 0) {
    proxy.primaryState.editingData.value = EDITING_DATA_ACTIVE;
  } else {
    proxy.primaryState.editingData.value = EDITING_DATA_INACTIVE;
  }
}

function handleSubmittingCreateEntryOnlineAction(
  globalState: IStateMachine,
  payload: SubmittingPayload,
  effectObjects: EffectObject,
) {
  (globalState.primaryState.common as PrimaryStateSubmitting).submitting = {
    context: {
      submittedCount: 1,
    },
  };

  const { createOnlineEntry, dispatch } = payload;

  const {
    primaryState: {
      context: { experienceId, entry },
    },
    dataStates,
  } = globalState;

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
    key: "createEntryOnline",
    args: {
      createOnlineEntry,
      input: {
        dataObjects,
        experienceId,
      },
      dispatch,
    },
    func: createEntryOnlineEffectFn,
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

////////////////////////// END STATE UPDATE FUNCTIONS /////////////////////

////////////////////////// EFFECT FUNCTIONS ////////////////////////////

function decrementOfflineEntriesCountEffectFn(
  args: DecrementOfflineEntriesCountForExperienceArgs,
) {
  decrementOfflineEntriesCountForExperience(args);
}

interface DecrementOfflineEntriesCountEffect {
  key: "decrementOfflineEntriesCount";
  func: typeof decrementOfflineEntriesCountEffectFn;
  args: {}; //DecrementOfflineEntriesCountForExperienceArgs;
}

async function createEntryOnlineEffectFn({
  createOnlineEntry,
  input,
  dispatch,
}: CreateEntryOnlineEffectFnArg) {
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
  } catch (errors) {}
}

interface CreateEntryOnlineEffectFnArg
  extends CreateOnlineEntryMutationComponentProps {
  input: CreateEntryInput;
  dispatch: DispatchType;
}

interface CreateEntryOnlineEffect {
  key: "createEntryOnline";
  args: CreateEntryOnlineEffectFnArg;
  func: typeof createEntryOnlineEffectFn;
}

function definitionsFormErrorsEffectFn({
  dispatch,
  definitionsWithFormErrors,
}: DefinitionsFormErrorsEffectFnArgs) {
  dispatch({
    type: ActionType.DEFINITION_FORM_ERRORS,
    ids: definitionsWithFormErrors,
  });
}

interface DefinitionsFormErrorsEffectFnArgs {
  dispatch: DispatchType;
  definitionsWithFormErrors: string[];
}

interface DefinitionsFormErrorsEffect {
  key: "definitionsFormErrors";
  args: DefinitionsFormErrorsEffectFnArgs;
  func: typeof definitionsFormErrorsEffectFn;
}

async function updateDefinitionsOnlineEffectFn({
  updateDefinitionsOnline,
  experienceId,
  definitionsInput,
  dispatch,
}: UpdateDefinitionsOnlineEffectFnArgs) {
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

    const validResponse = result && result.data && result.data;

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
    handleFormSubmissionException({
      dispatch,
      errors,
    });
  }
}

interface UpdateDefinitionsOnlineEffect {
  key: "updateDefinitionsOnline";
  args: UpdateDefinitionsOnlineEffectFnArgs;
  func: typeof updateDefinitionsOnlineEffectFn;
}

interface UpdateDefinitionsOnlineEffectFnArgs
  extends UpdateDefinitionsOnlineMutationComponentProps {
  experienceId: string;
  definitionsInput: UpdateDefinitionInput[];
  dispatch: DispatchType;
}

async function updateDataObjectsOnlineEffectFn({
  dispatch,
  updateDataObjectsOnline,
  dataInput,
}: UpdateDataObjectsOnlineEffectFnArgs) {
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
    handleFormSubmissionException({ dispatch, errors });
  }
}

interface UpdateDataObjectsOnlineEffectFnArgs
  extends UpdateDataObjectsOnlineMutationComponentProps {
  dataInput: UpdateDataObjectInput[];
  dispatch: DispatchType;
}

interface UpdateDataObjectsOnlineEffect {
  key: "updateDataObjectsOnline";
  func: typeof updateDataObjectsOnlineEffectFn;
  args: UpdateDataObjectsOnlineEffectFnArgs;
}

async function updateDefinitionsAndDataOnlineEffectFn({
  dispatch,
  experienceId,
  definitionsInput,
  dataInput,
  updateDefinitionsAndDataOnline,
}: UpdateDefinitionsAndDataOnlineEffectFnArgs) {
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
    handleFormSubmissionException({ errors, dispatch });
  }
}

interface UpdateDefinitionsAndDataOnlineEffectFnArgs
  extends UpdateDefinitionsAndDataOnlineMutationComponentProps {
  dataInput: UpdateDataObjectInput[];
  dispatch: DispatchType;
  experienceId: string;
  definitionsInput: UpdateDefinitionInput[];
}

interface UpdateDefinitionsAndDataOnlineEffect {
  key: "updateDefinitionsAndDataOnline";
  func: typeof updateDefinitionsAndDataOnlineEffectFn;
  args: UpdateDefinitionsAndDataOnlineEffectFnArgs;
}

//// EFFECT HELPERS
function handleFormSubmissionException({
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

////////////////////////// END EFFECT FUNCTIONS ////////////////////////////

export const EditEnryContext = createContext<ContextValue>({} as ContextValue);

////////////////////////// TYPES ////////////////////////////

interface ContextValue
  extends UpdateDefinitionsAndDataOnlineMutationComponentProps,
    UpdateDataObjectsOnlineMutationComponentProps {
  dispatch: DispatchType;
}

type EffectValueNoEffect = "noEffect";
type EffectValueHasEffects = "hasEffects";

export interface IStateMachine {
  readonly dataStates: DataStates;
  readonly definitionsStates: DefinitionsStates;
  readonly primaryState: PrimaryState;
  readonly effects: (EffectState | { value: EffectValueNoEffect }) & {
    context: EffectContext;
  };
}

interface EffectContext {
  metaFunctions: PutEffectMetaFunctionsPayload;
}

interface EffectState {
  value: EffectValueHasEffects;
  [EFFECT_VALUE_HAS_EFFECTS]: {
    context: {
      effects: EffectObject;
    };
  };
}

type EffectObject = (
  | UpdateDefinitionsOnlineEffect
  | CreateEntryOnlineEffect
  | DefinitionsFormErrorsEffect
  | UpdateDataObjectsOnlineEffect
  | UpdateDefinitionsAndDataOnlineEffect
  | DecrementOfflineEntriesCountEffect)[];

interface DefinitionAndDataIds {
  definitionId: string;
  dataId: string;
}

type EditingDefinitionInactive = "inactive";
type EditingDefinitionSingle = "single";
type EditingDefinitionMultiple = "multiple";

type EditingDataActive = "active";
type EditingDataInactive = "inactive";

export interface PrimaryState {
  context: {
    lenDefinitions: number;
    definitionAndDataIdsMapList: DefinitionAndDataIds[];
    experienceId: string;
    entry: EntryFragment;
  };

  common: PrimaryStateEditing | PrimaryStateSubmitting;

  editingData: {
    value: EditingDataActive | EditingDataInactive;
  };

  editingDefinition:
    | {
        value: EditingDefinitionSingle;
      }
    | {
        value: EditingDefinitionInactive;
      }
    | EditingMultipleDefinitionsState;

  submissionResponse: SubmissionResponseState;
}

interface PrimaryStateEditing {
  value: "editing";
}

interface PrimaryStateSubmitting {
  value: "submitting";

  submitting: {
    context: {
      submittedCount: number;
    };
  };
}

export type SubmissionResponseState =
  | {
      value: "inactive";
    }
  | (
      | {
          value: "apolloErrors";
          apolloErrors: {
            context: {
              errors: string;
            };
          };
        }
      | SubmissionSuccessState
      | {
          value: "otherErrors";

          otherErrors: {
            context: {
              errors: string;
            };
          };
        }
      | SubmissionFormErrorsState);

interface SubmissionFormErrorsState {
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
}

export interface EditingMultipleDefinitionsState {
  value: EditingDefinitionMultiple;

  [EDITING_DEFINITION_MULTIPLE]: {
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
  | {
      type: ActionType.DEFINITION_NAME_CHANGED;
    } & DefinitionNameChangedPayload
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
  | {
      type: ActionType.DEFINITIONS_SUBMISSION_RESPONSE;
    } & UpdateDefinitions
  | {
      type: ActionType.DEFINITION_FORM_ERRORS;
    } & DefinitionFormErrorsPayload
  | {
      type: ActionType.DATA_CHANGED;
    } & DataChangedPayload
  | {
      type: ActionType.DEFINITION_AND_DATA_SUBMISSION_RESPONSE;
    } & UpdateDefinitionAndData
  | {
      type: ActionType.DISMISS_SUBMISSION_RESPONSE_MESSAGE;
    }
  | {
      type: ActionType.DATA_OBJECTS_SUBMISSION_RESPONSE;
    } & UpdateDataObjects
  | {
      type: ActionType.OTHER_ERRORS;
    }
  | {
      type: ActionType.APOLLO_ERRORS;
    } & ApolloErrorsPayload
  | {
      type: ActionType.PUT_EFFECT_META_FUNCTIONS;
    } & PutEffectMetaFunctionsPayload;

interface ApolloErrorsPayload {
  errors: ApolloError;
}

interface PutEffectMetaFunctionsPayload
  extends CreateOnlineEntryMutationComponentProps,
    UpdateDefinitionsOnlineMutationComponentProps,
    UpdateDefinitionsAndDataOnlineMutationComponentProps,
    UpdateDataObjectsOnlineMutationComponentProps {
  dispatch: DispatchType;
}

interface SubmittingPayload
  extends CreateOnlineEntryMutationComponentProps,
    UpdateDefinitionsOnlineMutationComponentProps,
    UpdateDefinitionsAndDataOnlineMutationComponentProps,
    UpdateDataObjectsOnlineMutationComponentProps {
  dispatch: DispatchType;
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
  CreateOnlineEntryMutationComponentProps;

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
    | DefinitionChangedState) & {
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
    | DataServerErrorsState);
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

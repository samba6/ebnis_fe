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
  CreateEntryInput,
  UpdateDefinitionInput,
  UpdateDataObjectInput,
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
  EditEntryUpdateProps,
  editEntryUpdate,
} from "./edit-entry.injectables";
import { CreateOnlineEntryMutationComponentProps } from "../../graphql/create-entry.mutation";
import { isOfflineId } from "../../constants";
import { updateExperienceWithNewEntry } from "../NewEntry/new-entry.injectables";

export enum ActionTypes {
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
        proxy.effects = {
          value: EFFECT_VALUE_NO_EFFECT,
        };

        switch (type) {
          case ActionTypes.EDIT_BTN_CLICKED:
            {
              const { id } = payload as IdString;
              setDefinitionEditingUnchangedState(proxy, id);
            }
            break;

          case ActionTypes.UNDO_DEFINITION_EDITS:
            {
              const { id } = payload as IdString;
              setDefinitionEditingUnchangedState(proxy, id);
              setEditingDefinitionState(proxy, id);
            }
            break;

          case ActionTypes.DEFINITION_NAME_CHANGED:
            {
              const { id, formValue } = payload as DefinitionNameChangedPayload;
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

            break;

          case ActionTypes.STOP_DEFINITION_EDIT:
            {
              const { id } = payload as IdString;
              const { definitionsStates } = proxy;

              definitionsStates[id].value = "idle";

              setEditingDefinitionState(proxy, id);
            }

            break;

          case ActionTypes.SUBMITTING:
            {
              proxy.primaryState.common.value = "submitting";

              const {
                createOnlineEntry,
                dispatch,
              } = payload as SubmittingPayload;

              const effects = (proxy.effects as unknown) as EffectState;
              effects.value = EFFECT_VALUE_HAS_EFFECTS;
              const effectObjects: EffectObject = [];
              effects[EFFECT_VALUE_HAS_EFFECTS] = {
                context: {
                  effects: effectObjects,
                },
              };

              const { entry, experienceId } = proxy.primaryState.context;

              if (isOfflineId(entry.id)) {
                (proxy.primaryState
                  .common as PrimaryStateSubmitting).submitting = {
                  context: {
                    submittedCount: 1,
                  },
                };

                effectObjects.push({
                  key: "createEntryOnline",
                  args: {
                    createOnlineEntry,
                    entry: {
                      experienceId,
                      dataObjects: entry.dataObjects,
                    },
                    dispatch,
                  },
                  func: createEntryOnlineEffectFn,
                });

                return;
              }

              writeSendToServerEffects({
                payload: payload as SubmittingPayload,
                globalState: proxy,
                effectObjects,
              });
            }

            break;

          case ActionTypes.DEFINITIONS_SUBMISSION_RESPONSE:
            {
              prepareSubmissionResponse(
                proxy,
                payload as UpdateDefinitionAndData,
                "updateDefinitions",
              );
            }
            break;

          case ActionTypes.DEFINITION_FORM_ERRORS:
            {
              const { primaryState } = proxy;
              primaryState.common.value = "editing";

              const primaryStateFormErrors = {
                isActive: true,
                value: "formErrors",
                formErrors: {
                  context: {
                    errors:
                      "please correct the highlighted errors and resubmit",
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
            break;

          case ActionTypes.OTHER_ERRORS:
            {
              const { primaryState } = proxy;
              primaryState.common.value = "editing";

              const otherErrorsState = {
                isActive: true,
                value: "otherErrors",
                otherErrors: {
                  context: {
                    errors:
                      "We apologize, we are unable to fulfill your request this time",
                  },
                },
              } as SubmissionResponseState;

              primaryState.submissionResponse = {
                ...primaryState.submissionResponse,
                ...otherErrorsState,
              };
            }
            break;

          case ActionTypes.APOLLO_ERRORS:
            {
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
                    errors: networkError
                      ? networkError.message
                      : graphQLErrors[0].message,
                  },
                },
              } as SubmissionResponseState;

              primaryState.submissionResponse = {
                ...primaryState.submissionResponse,
                ...apolloErrorsState,
              };
            }
            break;

          case ActionTypes.DATA_CHANGED:
            {
              const { dataStates } = proxy;
              const { id, rawFormVal } = payload as DataChangedPayload;
              const state = dataStates[id];
              let { parsedVal, type } = state.context.defaults;

              const [original, stringed] = formObjToCompareString(
                type,
                rawFormVal,
              );

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
            break;

          case ActionTypes.DEFINITION_AND_DATA_SUBMISSION_RESPONSE:
            {
              const {
                updateDefinitions,
                updateDataObjects,
              } = payload as UpdateDefinitionAndData;

              prepareSubmissionResponse(
                proxy,
                {
                  updateDefinitions,
                  updateDataObjects,
                },
                "both",
              );
            }
            break;

          case ActionTypes.DISMISS_SUBMISSION_RESPONSE_MESSAGE:
            {
              (proxy.primaryState
                .submissionResponse as SubmissionResponseState).value =
                "inactive";
            }
            break;

          case ActionTypes.DATA_OBJECTS_SUBMISSION_RESPONSE:
            {
              prepareSubmissionResponse(
                proxy,
                payload as UpdateDefinitionAndData,
                "updateDataObjects",
              );
            }

            break;
        }
      });
    },
    // true,
  );

////////////////////////// REDUCER STATE UPDATE FUNCTIONS //////////////////
// you can write to state, but can not use dispatch - every call to dispatch
// must be put inside a function and added to effects

function prepareSubmissionResponse(
  proxy: IStateMachine,
  props: {
    updateDataObjects: UpdateDefinitionAndData["updateDataObjects"];
    updateDefinitions: UpdateDefinitionAndData["updateDefinitions"];
  },
  updating: "updateDataObjects" | "updateDefinitions" | "both",
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

  const { updateDataObjects, updateDefinitions } = props;
  let t1 = "valid";
  let t2 = "valid";

  if (updating === "updateDataObjects" || updating === "both") {
    let [s, f, t] = handleDataSubmissionResponse(
      proxy,
      context,
      updateDataObjects,
    ) as [number, number, string];

    successCount += s;
    failureCount += f;
    t1 = t;
  }

  if (updating === "updateDefinitions" || updating === "both") {
    const [s, f, t] = handleDefinitionsSubmissionResponse(
      proxy,
      context,
      updateDefinitions,
    ) as [number, number, string];

    successCount += s;
    failureCount += f;
    t2 = t;
  }

  if (t2 === "valid" && t1 === "valid") {
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

function putDefinitionInvalidErrors(context: SubmissionSuccessStateContext) {
  (context.invalidResponse as SubmissionInvalidResponse).definitions =
    "unable to change defintion names: unknown error occurred";
  return true;
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

function handleDataSubmissionResponse(
  proxy: IStateMachine,
  context: SubmissionSuccessStateContext,
  dataObjects: UpdateDefinitionAndData["updateDataObjects"],
) {
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

    const state = dataStates[id];

    if (dataObject) {
      state.context.defaults = {
        ...state.context.defaults,
        ...dataObject,
      };

      state.context.defaults.parsedVal = formObjFromRawString(dataObject.data);

      const unchangedState = (state as unknown) as DataUnchangedState;
      unchangedState.value = "unchanged";
      unchangedState.unchanged.context.anyEditSuccess = true;
      ++successCount;
    } else if (stringError) {
      ++failureCount;

      putDataServerErrors(
        state as DataChangedState,

        {
          definition: stringError as string,
        } as UpdateDataObjects_updateDataObjects_fieldErrors,
      );
    } else {
      ++failureCount;
      putDataServerErrors(
        state as DataChangedState,
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
  proxy: IStateMachine,
  context: SubmissionSuccessStateContext,
  updateDefinitions: UpdateDefinitionAndData["updateDefinitions"],
) {
  if (!updateDefinitions) {
    putDefinitionInvalidErrors(context);
    return [0, 0];
  }

  const { definitions } = updateDefinitions;

  if (!definitions) {
    putDefinitionInvalidErrors(context);
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

async function writeSendToServerEffects({
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

function getDataObjectsToSubmit(states: DataStates) {
  const inputs: UpdateDataObjectInput[] = [];

  for (const [id, state] of Object.entries(states)) {
    if (state.value === "changed") {
      const {
        context: {
          defaults: { type },
        },
        changed: {
          context: { formValue },
        },
      } = state;
      inputs.push({
        id,
        data: `{"${type.toLowerCase()}":"${formObjToString(type, formValue)}"}`,
      });
    }
  }

  return [inputs];
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

async function createEntryOnlineEffectFn({
  createOnlineEntry,
  entry,
}: CreateEntryOnlineEffectFnArg) {
  const { dataObjects, experienceId } = entry;

  const response = await createOnlineEntry({
    variables: {
      input: {
        dataObjects,
        experienceId,
      },
    },
    update: updateExperienceWithNewEntry(entry.experienceId),
  });

  const validResponse = response && response.data && response.data.createEntry;

  if (validResponse) {
    const { entry: onlineEntry } = validResponse;
    console.log(
      `\n\t\tLogging start\n\n\n\n onlineEntry\n`,
      onlineEntry,
      `\n\n\n\n\t\tLogging ends\n`,
    );
  }
}

interface CreateEntryOnlineEffectFnArg
  extends CreateOnlineEntryMutationComponentProps {
  entry: CreateEntryInput;
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
    type: ActionTypes.DEFINITION_FORM_ERRORS,
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

    const data = result && result.data;

    if (data) {
      dispatch({
        type: ActionTypes.DEFINITIONS_SUBMISSION_RESPONSE,
        ...data,
      });

      return;
    }

    dispatch({
      type: ActionTypes.OTHER_ERRORS,
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
        type: ActionTypes.DATA_OBJECTS_SUBMISSION_RESPONSE,
        ...successResult,
      });

      return;
    }

    dispatch({
      type: ActionTypes.OTHER_ERRORS,
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
        type: ActionTypes.DEFINITION_AND_DATA_SUBMISSION_RESPONSE,
        ...validResponse,
      });

      return;
    }

    dispatch({
      type: ActionTypes.OTHER_ERRORS,
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
      type: ActionTypes.APOLLO_ERRORS,
      errors,
    });
  } else {
    dispatch({
      type: ActionTypes.OTHER_ERRORS,
    });
  }
}

////////////////////////// END EFFECT FUNCTIONS ////////////////////////////

export const EditEnryContext = createContext<ContextValue>({} as ContextValue);

////////////////////////// TYPES ////////////////////////////

interface ContextValue
  extends UpdateDefinitionsAndDataOnlineMutationComponentProps,
    UpdateDataObjectsOnlineMutationComponentProps,
    EditEntryUpdateProps {
  dispatch: DispatchType;
}

type EffectValueNoEffect = "noEffect";
type EffectValueHasEffects = "hasEffects";

export interface IStateMachine {
  readonly dataStates: DataStates;
  readonly definitionsStates: DefinitionsStates;
  readonly primaryState: PrimaryState;
  readonly effects: EffectState | { value: EffectValueNoEffect };
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
  | UpdateDefinitionsAndDataOnlineEffect)[];

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

interface SubmittingPayload
  extends CreateOnlineEntryMutationComponentProps,
    UpdateDefinitionsOnlineMutationComponentProps,
    UpdateDefinitionsAndDataOnlineMutationComponentProps,
    UpdateDataObjectsOnlineMutationComponentProps {
  dispatch: DispatchType;
}

export type Action =
  | {
      type: ActionTypes.EDIT_BTN_CLICKED;
      id: string;
    }
  | {
      type: ActionTypes.DEFINITION_NAME_CHANGED;
    } & DefinitionNameChangedPayload
  | {
      type: ActionTypes.UNDO_DEFINITION_EDITS;
      id: string;
    }
  | {
      type: ActionTypes.STOP_DEFINITION_EDIT;
      id: string;
    }
  | ({
      type: ActionTypes.SUBMITTING;
    } & SubmittingPayload)
  | {
      type: ActionTypes.DESTROYED;
    }
  | {
      type: ActionTypes.DEFINITIONS_SUBMISSION_RESPONSE;
    } & UpdateDefinitions
  | {
      type: ActionTypes.DEFINITION_FORM_ERRORS;
    } & DefinitionFormErrorsPayload
  | {
      type: ActionTypes.DATA_CHANGED;
    } & DataChangedPayload
  | {
      type: ActionTypes.DEFINITION_AND_DATA_SUBMISSION_RESPONSE;
    } & UpdateDefinitionAndData
  | {
      type: ActionTypes.DISMISS_SUBMISSION_RESPONSE_MESSAGE;
    }
  | {
      type: ActionTypes.DATA_OBJECTS_SUBMISSION_RESPONSE;
    } & UpdateDataObjects
  | {
      type: ActionTypes.OTHER_ERRORS;
    }
  | {
      type: ActionTypes.APOLLO_ERRORS;
    } & ApolloErrorsPayload;

interface ApolloErrorsPayload {
  errors: ApolloError;
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
  EditEntryUpdateProps &
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

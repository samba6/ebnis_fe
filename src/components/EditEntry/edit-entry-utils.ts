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
import { DataTypes } from "../../graphql/apollo-types/globalTypes";
import {
  UpdateDataObjectsOnlineMutationProps,
  UpdateDefinitionAndDataOnlineMutationProps,
} from "../../graphql/update-definition-and-data.mutation";
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
  SUBMISSION_RESPONSE = "@component/edit-entry/submission-response",
  DISMISS_SUBMISSION_RESPONSE_MESSAGE = "@component/edit-entry/dismiss-submission-response-message",
  OTHER_ERRORS = "@component/edit-entry/other-errors",
  APOLLO_ERRORS = "@component/edit-entry/apollo-errors",
}

export const initStateFromProps = (props: Props): IStateMachine => {
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
    primaryState: {
      context: {
        lenDefinitions,
        definitionAndDataIdsMapList,
        experienceId: experience.id,
      },

      common: {
        value: "editing" as "editing",
      },

      editingData: {
        value: "inactive" as "inactive",
      },

      editingMultipleDefinitions: {
        value: "inactive" as "inactive",
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
              setEditingMultipleDefinitionsState(proxy);
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

              setEditingMultipleDefinitionsState(proxy);
            }

            break;

          case ActionTypes.STOP_DEFINITION_EDIT:
            {
              const { id } = payload as IdString;
              const { definitionsStates } = proxy;

              definitionsStates[id].value = "idle";

              setEditingMultipleDefinitionsState(proxy);
            }

            break;

          case ActionTypes.SUBMITTING:
            {
              proxy.primaryState.common.value = "submitting";

              (proxy.primaryState
                .common as PrimaryStateSubmitting).submitting = {
                context: {
                  submittedCount: (payload as {
                    submittedCount: number;
                  }).submittedCount,
                },
              };
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

          case ActionTypes.SUBMISSION_RESPONSE:
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
  );

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
    primaryState.editingData.value = "inactive";
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

function setEditingMultipleDefinitionsState(proxy: IStateMachine) {
  const { primaryState } = proxy;
  const len = primaryState.context.lenDefinitions;

  if (len < 2) {
    return;
  }

  let firstChangedDefinitionId = "";
  let changedDefinitionsCount = 0;

  for (const [id, state] of Object.entries(proxy.definitionsStates)) {
    if (state.value === "editing" && state.editing.value === "changed") {
      ++changedDefinitionsCount;

      if (firstChangedDefinitionId === "") {
        firstChangedDefinitionId = id;
      }
    }
  }

  const { editingMultipleDefinitions } = primaryState;

  if (changedDefinitionsCount < 2) {
    editingMultipleDefinitions.value = "inactive";
  } else {
    editingMultipleDefinitions.value = "active";

    (editingMultipleDefinitions as EditingMultipleDefinitionsActiveState).context = {
      firstChangedDefinitionId,
    };
  }
}

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

export const EditEnryContext = createContext<ContextValue>({} as ContextValue);

function setEditingData(proxy: IStateMachine) {
  let dataChangedCount = 0;

  for (const state of Object.values(proxy.dataStates)) {
    if (state.value === "changed") {
      ++dataChangedCount;
    }
  }

  if (dataChangedCount !== 0) {
    proxy.primaryState.editingData.value = "active";
  } else {
    proxy.primaryState.editingData.value = "inactive";
  }
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

////////////////////////// TYPES ////////////////////////////

interface ContextValue
  extends UpdateDefinitionAndDataOnlineMutationProps,
    UpdateDataObjectsOnlineMutationProps {
  dispatch: DispatchType;
  editEntryUpdate: () => void;
}

export interface IStateMachine {
  readonly dataStates: DataStates;
  readonly definitionsStates: DefinitionsStates;
  readonly primaryState: PrimaryState;
}

interface DefinitionAndDataIds {
  definitionId: string;
  dataId: string;
}

export interface PrimaryState {
  context: {
    lenDefinitions: number;
    definitionAndDataIdsMapList: DefinitionAndDataIds[];
    experienceId: string;
  };

  common: PrimaryStateEditing | PrimaryStateSubmitting;

  editingData: {
    value: "active" | "inactive";
  };

  editingMultipleDefinitions:
    | {
        value: "inactive";
      }
    | EditingMultipleDefinitionsActiveState;

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

export interface EditingMultipleDefinitionsActiveState {
  value: "active";

  context: {
    firstChangedDefinitionId: string;
  };
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
  | {
      type: ActionTypes.SUBMITTING;
      submittedCount: number;
    }
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
      type: ActionTypes.SUBMISSION_RESPONSE;
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

export interface Props {
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

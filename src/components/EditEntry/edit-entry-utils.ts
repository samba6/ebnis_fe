import { EntryFragment } from "../../graphql/apollo-types/EntryFragment";
import { DataDefinitionFragment } from "../../graphql/apollo-types/DataDefinitionFragment";
import { Dispatch, Reducer, createContext } from "react";
import immer from "immer";
import {
  UpdateDefinitions_updateDefinitions,
  UpdateDefinitions_updateDefinitions_definitions,
  UpdateDefinitions_updateDefinitions_definitions_errors_errors,
  UpdateDefinitions_updateDefinitions_definitions_errors,
} from "../../graphql/apollo-types/UpdateDefinitions";
import { ExperienceFragment } from "../../graphql/apollo-types/ExperienceFragment";
import { DataObjectFragment } from "../../graphql/apollo-types/DataObjectFragment";
import { FormObjVal } from "../Experience/experience.utils";
import { FieldType } from "../../graphql/apollo-types/globalTypes";
import {
  UpdateDataObjectsOnlineMutationProps,
  UpdateDefinitionsMutationProps,
  UpdateDefinitionAndDataOnlineMutationProps,
} from "../../graphql/update-definition-and-data.mutation";
import { UpdateDefinitionAndData } from "../../graphql/apollo-types/UpdateDefinitionAndData";
import {
  UpdateDataObjects_updateDataObjects,
  UpdateDataObjects_updateDataObjects_fieldErrors,
} from "../../graphql/apollo-types/UpdateDataObjects";
import { UpdateDataObjectsResponseFragment_fieldErrors } from "../../graphql/apollo-types/UpdateDataObjectsResponseFragment";
import { wrapReducer } from "../../logger";

export enum ActionTypes {
  EDIT_BTN_CLICKED = "@component/edit-entry/edit-btn-clicked",
  DEFINITION_NAME_CHANGED = "@component/edit-entry/definition-name-changed",
  UNDO_DEFINITION_EDITS = "@component/edit-entry/undo-definition-edits",
  STOP_DEFINITION_EDIT = "@component/edit-entry/stop-definition-edit",
  SUBMITTING = "@component/edit-entry/definitions-submitted",
  DESTROYED = "@component/edit-entry/destroy",
  DEFINITIONS_SUBMISSION_RESPONSE = "@component/edit-entry/definitions-submission-response",
  DEFINITION_FORM_ERRORS = "@component/edit-entry/definition-form-errors",
  DATA_CHANGED = "@component/edit-entry/data-changed",
  SUBMISSION_RESPONSE = "@component/edit-entry/submission-response",
  DISMISS_SUBMISSION_RESPONSE_MESSAGE = "@component/edit-entry/dismiss-submission-response-message",
}

export const initStateFromProps = (props: Props): State => {
  const [dataStates, idsMap, dataIds] = props.entry.dataObjects.reduce(
    ([statesMap, idsMap, dataIds], obj) => {
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
            type: FieldType.DATE, // make typescript happy, correct value below
          },
        },
      };

      idsMap[data.definitionId] = id;

      return [statesMap, idsMap, dataIds];
    },
    [{} as DataStates, {} as { [k: string]: string }, [] as string[]],
  );

  const definitions = props.experience
    .dataDefinitions as DataDefinitionFragment[];

  let lenDefinitions = 0;

  const [definitionsStates, definitionsIds] = definitions.reduce(
    ([acc, definitionsIds], definition) => {
      const { id, type } = definition;
      definitionsIds.push(id);
      ++lenDefinitions;

      acc[id] = {
        value: "idle",

        idle: {
          context: {},
        },

        context: {
          defaults: definition,
        },
      };

      const dataState = dataStates[idsMap[id]];

      if (dataState) {
        dataState.context.defaults.type = type;
      }

      return [acc, definitionsIds];
    },
    [{} as DefinitionsStates, [] as string[]],
  );

  return {
    primaryState: {
      context: {
        lenDefinitions,

        definitionsIds,

        dataIds,
      },

      common: {
        value: "editing",
      },
    },

    definitionsStates,

    dataStates,
  };
};

export const reducer: Reducer<State, Action> = (state, action) =>
  wrapReducer<State, Action>(
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

              //console.log(JSON.stringify(proxy.primaryState, null, 2));
            }

            break;

          case ActionTypes.DEFINITIONS_SUBMISSION_RESPONSE:
            {
              proxy.primaryState.common.value = "editing";

              const context = {
                invalidResponse: {},
              } as SubmissionSuccessStateContext;

              handleDefinitionsSubmissionResponse(
                proxy,
                context,
                payload as UpdateDefinitions_updateDefinitions,
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
                ...(primaryState.submissionResponse || {}),
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

          case ActionTypes.DATA_CHANGED:
            {
              const { dataStates } = proxy;
              const { id, rawFormVal } = payload as DataChangedPayload;
              const state = dataStates[id];
              let { parsedVal } = state.context.defaults;
              const [original, stringed] = formObjToCompareString(rawFormVal);

              if (formObjToCompareString(parsedVal)[1] === stringed) {
                state.value = "unchanged";
              } else {
                state.value = "changed";
                const changedState = state as DataChangedState;

                changedState.changed = {
                  context: {
                    formValue: original,
                  },

                  value: "normal",
                };
              }

              setEditingData(proxy);
            }
            break;

          case ActionTypes.SUBMISSION_RESPONSE:
            {
              const { primaryState } = proxy;
              primaryState.common.value = "editing";

              const {
                updateDataObjects,
                updateDefinitions,
              } = payload as UpdateDefinitionAndData;

              const submissionSuccessResponse = {
                value: "submissionSuccess",
              } as SubmissionSuccessState;

              const context = {
                invalidResponse: {},
              } as SubmissionSuccessStateContext;

              let successCount = 0;
              let failureCount = 0;

              const [s, f, t] = handleDataSubmissionResponse(
                proxy,
                context,
                updateDataObjects,
              ) as [number, number, string];

              successCount += s;
              failureCount += f;

              const [s1, f1, t1] = handleDefinitionsSubmissionResponse(
                proxy,
                context,
                updateDefinitions,
              ) as [number, number, string];

              successCount += s1;
              failureCount += f1;

              if (t === "valid" && t1 === "valid") {
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
                ...(primaryState.submissionResponse || {}),
                ...submissionSuccessResponse,
                isActive: true,
              };
            }
            break;

          case ActionTypes.DISMISS_SUBMISSION_RESPONSE_MESSAGE:
            {
              (proxy.primaryState
                .submissionResponse as SubmissionResponseState).isActive = false;
            }
            break;
        }
      });
    },
  );

function putDefinitionInvalidErrors(context: SubmissionSuccessStateContext) {
  (context.invalidResponse as SubmissionInvalidResponse).definitions =
    "unable to change defintion names: unknown error occurred";
  return true;
}

function setDefinitionEditingUnchangedState(proxy: State, id: string) {
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

function setEditingMultipleDefinitionsState(proxy: State) {
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

  primaryState.editingMultipleDefinitions =
    changedDefinitionsCount < 2
      ? undefined
      : {
          context: {
            firstChangedDefinitionId,
          },
        };
}

function formObjFromRawString(val: string) {
  const [[k, v]] = Object.entries(JSON.parse(val));

  if (k === "date" || k === "datetime") {
    return new Date(v);
  }

  return (("" + v) as string).trim();
}

function formObjToCompareString(val: FormObjVal) {
  if (val instanceof Date) {
    return [val, (val as Date).toJSON()];
  }

  val = (val as string).trim();
  return [val, val];
}

export const EditEnryContext = createContext<ContextValue>({} as ContextValue);

function setEditingData(proxy: State) {
  let dataChangedCount = 0;

  for (const state of Object.values(proxy.dataStates)) {
    if (state.value === "changed") {
      ++dataChangedCount;
    }
  }

  if (dataChangedCount !== 0) {
    proxy.primaryState.editingData = true;
  } else {
    delete proxy.primaryState.editingData;
  }
}

function handleDefinitionsSubmissionResponse(
  proxy: State,
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
  proxy: State,
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

    if (state.value !== "changed") {
      return;
    }

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
    //console.log(JSON.stringify(state, null, 2));
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

export interface State {
  readonly dataStates: DataStates;
  readonly definitionsStates: DefinitionsStates;
  readonly primaryState: PrimaryState;
}

interface PrimaryState {
  context: {
    definitionsIds: string[];
    lenDefinitions: number;
    dataIds: string[];
  };

  common:
    | PrimaryStateEditing
    | {
        value: "submitting";
      };

  editingData?: true;

  editingMultipleDefinitions?: EditingMultipleDefinitionsState;

  submissionResponse?: SubmissionResponseState;
}

interface PrimaryStateEditing {
  value: "editing";
}

export type SubmissionResponseState = {
  isActive: boolean;
} & (
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
      value: "unknownSubmissionError";

      unknownSubmissionError: {
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
    }
  | {
      type: ActionTypes.DESTROYED;
    }
  | {
      type: ActionTypes.DEFINITIONS_SUBMISSION_RESPONSE;
    } & UpdateDefinitions_updateDefinitions
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
    };

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

export interface OwnProps {
  entry: EntryFragment;
  experience: ExperienceFragment;
  dispatch: DispatchType;
  editEntryUpdate: () => void;
}

export interface Props
  extends OwnProps,
    UpdateDefinitionsMutationProps,
    UpdateDataObjectsOnlineMutationProps,
    UpdateDefinitionAndDataOnlineMutationProps {}

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
      type: FieldType;
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

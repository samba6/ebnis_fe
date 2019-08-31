import { EntryFragment } from "../../graphql/apollo-types/EntryFragment";
import { DataDefinitionFragment } from "../../graphql/apollo-types/DataDefinitionFragment";
import { Dispatch, Reducer, createContext } from "react";
import immer from "immer";
import { UpdateDefinitionsMutationProps } from "../../graphql/update-definitions.mutation";
import {
  UpdateDefinitions_updateDefinitions,
  UpdateDefinitions_updateDefinitions_definitions,
  UpdateDefinitions_updateDefinitions_definitions_errors_errors,
} from "../../graphql/apollo-types/UpdateDefinitions";
import { ExperienceFragment } from "../../graphql/apollo-types/ExperienceFragment";
import { DataObjectFragment } from "../../graphql/apollo-types/DataObjectFragment";
import { FormObjVal } from "../Experience/experience.utils";
import { FieldType } from "../../graphql/apollo-types/globalTypes";

export enum ActionTypes {
  EDIT_BTN_CLICKED = "@component/edit-entry/edit-btn-clicked",
  DEFINITION_NAME_CHANGED = "@component/edit-entry/definition-name-changed",
  UNDO_DEFINITION_EDITS = "@component/edit-entry/undo-definition-edits",
  STOP_DEFINITION_EDIT = "@component/edit-entry/stop-definition-edit",
  DEFINITION_SUBMITTED = "@component/edit-entry/title-submit",
  DESTROYED = "@component/edit-entry/destroy",
  SUBMISSION_RESULT = "@component/edit-entry/submission-result",
  DEFINITION_FORM_ERRORS = "@component/edit-entry/definition-form-errors",
  DATA_CHANGED = "@component/edit-entry/data-changed",
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
            formObj: toFormObj(data.data),
            type: FieldType.DATE, // make typescipt happy, correct value below
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

export const reducer: Reducer<State, Action> = (
  prevState,
  { type, ...payload },
) => {
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

      case ActionTypes.DEFINITION_SUBMITTED:
        {
          proxy.primaryState.common.value = "submitting";
        }

        break;

      case ActionTypes.SUBMISSION_RESULT:
        {
          const {
            definitions,
          } = payload as UpdateDefinitions_updateDefinitions;

          const { definitionsStates } = proxy;
          proxy.primaryState.common.value = "editing";

          definitions.forEach(def => {
            const {
              definition,
              errors,
            } = def as UpdateDefinitions_updateDefinitions_definitions;

            if (definition) {
              const { id, name } = definition;
              const state = definitionsStates[id];
              state.context.defaults.name = name;

              state.value = "idle";

              (state as DefinitionIdleState).idle.context.anyEditSuccess = true;

              return;
            }

            if (errors) {
              const { id, ...errorsContext } = errors;
              const state = definitionsStates[id] as DefinitionEditingState;

              (state.editing as DefinitionChangedState).changed = {
                value: "serverErrors",
                context: { ...errorsContext },
              };
            }
          });
        }
        break;

      case ActionTypes.DEFINITION_FORM_ERRORS:
        {
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
          const { primaryState } = proxy;
          // const { id } = payload as DataChangedPayload;
          // const state = dataStates[id];

          primaryState.editingData = true;
        }
        break;
    }
  });
};

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

function toFormObj(val: string) {
  const [[k, v]] = Object.entries(JSON.parse(val));

  if (k === "date" || k === "datetime") {
    return new Date(v);
  }

  return v;
}

export const EditEnryContext = createContext<ContextValue>({} as ContextValue);

////////////////////////// TYPES ////////////////////////////

interface ContextValue {
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

  common: {
    value: "editing" | "submitting";
  };

  editingData?: true;

  editingMultipleDefinitions?: EditingMultipleDefinitionsState;
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
      type: ActionTypes.DEFINITION_SUBMITTED;
    }
  | {
      type: ActionTypes.DESTROYED;
    }
  | {
      type: ActionTypes.SUBMISSION_RESULT;
    } & UpdateDefinitions_updateDefinitions
  | {
      type: ActionTypes.DEFINITION_FORM_ERRORS;
    } & DefinitionFormErrorsPayload
  | {
      type: ActionTypes.DATA_CHANGED;
    } & DataChangedPayload;

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

export interface Props extends OwnProps, UpdateDefinitionsMutationProps {}

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

interface DataStates {
  [k: string]: DataState;
}

export type DataState = {
  context: {
    defaults: DataObjectFragment & {
      formObj: FormObjVal;
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
      formValue: {};
    };
  };
}

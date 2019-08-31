import { EntryFragment } from "../../graphql/apollo-types/EntryFragment";
import { DataDefinitionFragment } from "../../graphql/apollo-types/DataDefinitionFragment";
import { Dispatch, Reducer } from "react";
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
  const [dataStates, idsMap] = props.entry.dataObjects.reduce(
    ([statesMap, idsMap], obj) => {
      const data = obj as DataObjectFragment;
      statesMap[data.id] = {
        value: "unchanged",

        unchanged: {
          context: {},
        },

        context: {
          defaults: { ...data, formObj: toFormObj(data.data) },
        },
      };

      idsMap[data.definitionId] = data.id;

      return [statesMap, idsMap];
    },
    [{} as DataStates, {} as { [k: string]: string }],
  );

  const definitions = props.experience
    .dataDefinitions as DataDefinitionFragment[];

  const definitionsStates = definitions.reduce(
    (acc, definition) => {
      acc[definition.id] = {
        value: "idle",

        idle: {
          context: {},
        },

        context: {
          defaults: definition,
          dataId: idsMap[definition.id],
        },
      };

      return acc;
    },
    {} as DefinitionsStates,
  );

  return {
    primaryState: {
      context: {
        definitionsIds: definitions.map(
          def => (def as DataDefinitionFragment).id,
        ),
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
          setEditingMultipleDefinitionsStates(proxy.definitionsStates);
        }
        break;

      case ActionTypes.DEFINITION_NAME_CHANGED:
        {
          const { id, formValue } = payload as DefinitionNameChangedPayload;
          const state = proxy.definitionsStates[id];
          const { name: defaultName } = state.context.defaults;
          const editingState = state as DefinitionEditingState;

          if (defaultName === formValue.trim()) {
            setDefinitionEditingUnchangedState(proxy, id);
          } else {
            state.value = "editing";
            editingState.editing = {
              value: "changed",

              context: {
                formValue,
              },

              changed: {
                form: {
                  value: "regular",
                },
              },
            };

            //if (!proxy.editingData) {
            (editingState.editing as DefinitionChangedState).changed.notEditingData = {
              value: "notEditingSiblings",
            };

            //}
          }

          setEditingMultipleDefinitionsStates(proxy.definitionsStates);
        }

        break;

      case ActionTypes.STOP_DEFINITION_EDIT:
        {
          const { id } = payload as IdString;
          const { definitionsStates } = proxy;

          definitionsStates[id].value = "idle";

          setEditingMultipleDefinitionsStates(definitionsStates);
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

              (state.editing as DefinitionChangedState).changed.form = {
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
              .editing as DefinitionChangedState).changed.form = {
              value: "formErrors",
              context: {
                errors,
              },
            };
          }
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

function setEditingMultipleDefinitionsStates(
  definitionsStates: DefinitionsStates,
) {
  let editCount = 0;
  const statesToChange: DefinitionChangedState["changed"][] = [];

  for (const state of Object.values(definitionsStates)) {
    if (state.value === "editing" && state.editing.value === "changed") {
      ++editCount;
      statesToChange.push(state.editing.changed);
    }
  }

  if (editCount === 1) {
    const state = statesToChange[0];

    state.notEditingData = {
      value: "notEditingSiblings",
    };
  }

  if (editCount > 1) {
    for (let i = 0; i < editCount; i++) {
      const state = statesToChange[i];

      if (state.notEditingData) {
        state.notEditingData = {
          value: "editingSiblings",
          editingSiblings: {},
        };

        if (i === 0) {
          state.notEditingData.editingSiblings.firstEditableSibling = true;
        }
      }
    }
  }
}

function toFormObj(val: string) {
  const [[k, v]] = Object.entries(JSON.parse(val));

  if (k === "date" || k === "datetime") {
    return new Date(v);
  }

  return v;
}

////////////////////////// TYPES ////////////////////////////

export interface State {
  readonly dataStates: DataStates;
  readonly definitionsStates: DefinitionsStates;
  readonly primaryState: PrimaryState;
}

interface PrimaryState {
  context: {
    definitionsIds: string[];
  };

  common: {
    value: "editing" | "submitting";
  };

  editingData?: true;

  editingMultipleDefinitions?: {
    context: {
      indexOfFirstChangedDefinition: number;
    };
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
    dataId: string;
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

  changed: {
    form:
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

    notEditingData?:
      | {
          value: "notEditingSiblings";
        }
      | {
          value: "editingSiblings";
          editingSiblings: {
            firstEditableSibling?: true;
          };
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

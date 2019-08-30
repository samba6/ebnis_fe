import { EntryFragment } from "../../graphql/apollo-types/EntryFragment";
import { DataDefinitionFragment } from "../../graphql/apollo-types/DataDefinitionFragment";
import { Dispatch, Reducer, createContext } from "react";
import immer from "immer";
import { UpdateDefinitionsMutationProps } from "../../graphql/update-definitions.mutation";
import { DataObjectFragment } from "../../graphql/apollo-types/DataObjectFragment";
import {
  UpdateDefinitions_updateDefinitions,
  UpdateDefinitions_updateDefinitions_definitions,
  UpdateDefinitions_updateDefinitions_definitions_errors_errors,
} from "../../graphql/apollo-types/UpdateDefinitions";

export enum ActionTypes {
  EDIT_BTN_CLICKED = "@component/edit-entry/edit-btn-clicked",
  DEFINITION_NAME_CHANGED = "@component/edit-entry/definition-name-changed",
  UNDO_DEFINITION_EDITS = "@component/edit-entry/undo-definition-edits",
  STOP_DEFINITION_EDIT = "@component/edit-entry/stop-definition-edit",
  TITLE_EDIT_SUBMIT = "@component/edit-entry/title-submit",
  DESTROYED = "@component/edit-entry/destroy",
  SUBMISSION_RESULT = "@component/edit-entry/submission-result",
  DEFINITION_FORM_ERRORS = "@component/edit-entry/definition-form-errors",
}

function defaultsFromProps(props: Props) {
  const { entry, definitions } = props;

  const objectsMap = (entry.dataObjects as DataObjectFragment[]).reduce(
    (acc, dataObject) => {
      acc[dataObject.definitionId] = dataObject;
      return acc;
    },
    {} as { [k: string]: DataObjectFragment },
  );

  const [definitionsIds, definitionsDefaultsMap] = definitions.reduce(
    ([ids, map], definition) => {
      ids.push(definition.id);
      map[definition.id] = {
        definition,
        dataObject: objectsMap[definition.id],
      };

      return [ids, map];
    },
    [[], {}] as [string[], DefinitionsDefaultsMap],
  );

  return {
    definitionsIds,
    definitionsDefaultsMap,
  };
}

export const initStateFromProps = (props: Props): State => {
  const { definitions } = props;

  const initialDefinitionsStates = definitions.reduce(
    (acc, definition) => {
      acc[definition.id] = {
        state: {
          value: "idle",
        },

        formValue: definition.name,
      };

      return acc;
    },
    {} as DefinitionsStates,
  );

  return {
    ...defaultsFromProps(props),
    definitionsStates: initialDefinitionsStates,
    value: "nothing",
    editingMultipleDefinitions: false,
  };
};

export const reducer: Reducer<State, Action> = (
  prevState,
  { type, ...payload },
) => {
  return immer(prevState, proxy => {
    switch (type) {
      case ActionTypes.EDIT_BTN_CLICKED:
      case ActionTypes.UNDO_DEFINITION_EDITS:
        {
          const { id } = payload as IdString;

          proxy.definitionsStates[id].state = {
            value: "editing",
            editing: {
              value: "unchanged",
            },
          };
        }

        break;

      case ActionTypes.DEFINITION_NAME_CHANGED:
        {
          const { id, formValue } = payload as DefinitionNameChangedPayload;
          const definitionState = proxy.definitionsStates[id];

          const { definitionsDefaultsMap } = proxy;
          const { definition } = definitionsDefaultsMap[id];

          let state: DefinitionState["state"];

          if (definition.name === formValue.trim()) {
            state = {
              value: "editing",

              editing: {
                value: "unchanged",
              },
            };
          } else {
            state = {
              value: "editing",

              editing: {
                value: "changed",

                changed: {
                  form: {
                    value: "regular",
                  },
                },
              },
            } as DefinitionState["state"];

            //if (!proxy.editingData) {
            ((state as DefinitionEditingState)
              .editing as DefinitionChangedState).changed.notEditingData = {
              value: "notEditingSiblings",
            };
            //}
          }

          definitionState.state = state;
          definitionState.formValue = formValue;
          setEditingMultipleDefinitionsStates(proxy.definitionsStates);
        }

        break;

      case ActionTypes.STOP_DEFINITION_EDIT:
        {
          const { id } = payload as IdString;
          const { definitionsStates } = proxy;

          definitionsStates[id].state = {
            value: "idle",
          };

          setEditingMultipleDefinitionsStates(definitionsStates);
        }

        break;

      case ActionTypes.TITLE_EDIT_SUBMIT:
        {
          proxy.value = "submitting";
        }

        break;

      case ActionTypes.SUBMISSION_RESULT:
        {
          const {
            definitions,
          } = payload as UpdateDefinitions_updateDefinitions;

          const { definitionsStates , definitionsDefaultsMap} = proxy;
          proxy.value = "nothing";

          definitions.forEach(def => {
            const {
              definition,
              errors,
            } = def as UpdateDefinitions_updateDefinitions_definitions;

            if (definition) {
              const { id, name } = definition;
              definitionsDefaultsMap[id].definition.name = name
              const stateInfo = definitionsStates[id];

              stateInfo.state = {
                value: "idle",
                idle: {
                  value: "anyEditSuccessful",
                },
              };

              return;
            }

            if (errors) {
              const { id, ...errorsContext } = errors;
              const state = definitionsStates[id]
                .state as DefinitionEditingState;

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

            ((definitionState.state as DefinitionEditingState)
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

function setEditingMultipleDefinitionsStates(
  definitionsStates: DefinitionsStates,
) {
  let editCount = 0;
  const statesToChange: DefinitionChangedState["changed"][] = [];

  for (const { state } of Object.values(definitionsStates)) {
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

export const DefinitionsContext = createContext<DefinitionsContextValues>(
  {} as DefinitionsContextValues,
);

export const DefinitionsContextProvider = DefinitionsContext.Provider;

////////////////////////// TYPES ////////////////////////////

export interface State {
  readonly definitionsStates: DefinitionsStates;
  readonly value: "nothing" | "submitting";
  readonly editingData?: boolean;
  readonly definitionsDefaultsMap: DefinitionsDefaultsMap;
  readonly definitionsIds: string[];
  readonly editingMultipleDefinitions: boolean;
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
      type: ActionTypes.TITLE_EDIT_SUBMIT;
    }
  | {
      type: ActionTypes.DESTROYED;
    }
  | {
      type: ActionTypes.SUBMISSION_RESULT;
    } & UpdateDefinitions_updateDefinitions
  | {
      type: ActionTypes.DEFINITION_FORM_ERRORS;
    } & DefinitionFormErrorsPayload;

interface DefinitionNameChangedPayload {
  id: string;
  formValue: string;
}

interface DefinitionFormErrorsPayload {
  ids: string[];
}

export interface OwnProps {
  entry: EntryFragment;
  definitions: DataDefinitionFragment[];
  dispatch: DispatchType;
}

export interface Props extends OwnProps, UpdateDefinitionsMutationProps {}

export interface DefinitionsDefaultsMap {
  [k: string]: {
    definition: DataDefinitionFragment;
    dataObject: DataObjectFragment;
  };
}

export type DefinitionFormValue = Pick<
  DataDefinitionFragment,
  Exclude<keyof DataDefinitionFragment, "__typename" | "clientId" | "type">
>;

export interface FormValues {
  definitions: DefinitionFormValue[];
}

export type DispatchType = Dispatch<Action>;

export interface DefinitionState {
  state:
    | {
        value: "idle";
        idle?: {
          value: "anyEditSuccessful";
        };
      }
    | DefinitionEditingState;

  formValue: string;
}

interface DefinitionEditingState {
  value: "editing";

  editing:
    | {
        value: "unchanged";
      }
    | DefinitionChangedState;
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

export interface DefinitionsStates {
  [k: string]: DefinitionState;
}

interface IdString {
  id: string;
}

interface DefinitionsContextValues extends UpdateDefinitionsMutationProps {
  definitionsDefaultsMap: DefinitionsDefaultsMap;
  dispatch: DispatchType;
}

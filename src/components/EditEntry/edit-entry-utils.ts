import { EntryFragment } from "../../graphql/apollo-types/EntryFragment";
import { DataDefinitionFragment } from "../../graphql/apollo-types/DataDefinitionFragment";
import { Dispatch, Reducer, createContext } from "react";
import immer from "immer";
import { UpdateDefinitionsMutationProps } from "../../graphql/update-definitions.mutation";
import { DataObjectFragment } from "../../graphql/apollo-types/DataObjectFragment";
import {
  UpdateDefinitions_updateDefinitions,
  UpdateDefinitions_updateDefinitions_definitions,
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
            states: {
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

              states: {
                value: "unchanged",
              },
            };
          } else {
            state = {
              value: "editing",

              states: {
                value: "changed",

                states: {
                  form: {
                    value: "regular",
                  },
                },
              },
            } as DefinitionState["state"];

            //if (!proxy.editingData) {
            (state.states as DefinitionChangedState).states.notEditingData = {
              value: "notEditingSiblings",
            };
            //}
          }

          definitionState.state = state;
          definitionState.formValue = formValue;
          setEditingMultipleDefinitions(proxy.definitionsStates);
        }

        break;

      case ActionTypes.STOP_DEFINITION_EDIT:
        {
          const { id } = payload as IdString;
          proxy.definitionsStates[id].state = {
            value: "idle",
          };
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

          definitions.forEach(def => {
            const {
              definition,
            } = def as UpdateDefinitions_updateDefinitions_definitions;

            proxy.definitionsStates[definition.id].state = {
              value: "idle",
              states: {
                value: "anyEditSuccessful",
              },
            };
          });
        }
        break;

      case ActionTypes.DEFINITION_FORM_ERRORS:
        {
          const { id, errors } = payload as DefinitionFormErrorsPayload;
          const definitionState = proxy.definitionsStates[id];

          (definitionState.state
            .states as DefinitionChangedState).states.form = {
            value: "formErrors",
            context: {
              errors,
            },
          };
        }
        break;
    }
  });
};

function setEditingMultipleDefinitions(definitionsStates: DefinitionsStates) {
  let editCount = 0;
  const statesToChange: DefinitionChangedState["states"][] = [];

  for (const { state } of Object.values(definitionsStates)) {
    if (state.value === "editing" && state.states.value === "changed") {
      ++editCount;
      statesToChange.push(state.states.states);
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
          states: {},
        };

        if (i === 0) {
          state.notEditingData.states.firstEditableSibling = true;
        }
      }
    }
  }
}

export const DefinitionsContext = createContext<DefinitionsContextValues>(
  {} as DefinitionsContextValues,
);

export const DefinitionsContextProvider = DefinitionsContext.Provider;

export function getDefinitionFormError(state: DefinitionState["state"]) {
  if (
    state.value === "editing" &&
    state.states.value === "changed" &&
    state.states.states.form.value === "formErrors"
  ) {
    return state.states.states.form.context.errors.name;
  }

  return null;
}

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
  id: string;
  errors: {
    name: string;
  };
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
        states?: {
          value: "anyEditSuccessful";
        };
      }
    | {
        value: "editing";

        states:
          | {
              value: "unchanged";
            }
          | DefinitionChangedState;
      };

  formValue: string;
}

export interface DefinitionChangedState {
  value: "changed";

  states: {
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
            errors: DefinitionFormErrorsPayload["errors"];
          };
        }
      | {
          value: "serverErrors";
          context: {};
        };

    notEditingData?:
      | {
          value: "notEditingSiblings";
        }
      | {
          value: "editingSiblings";
          states: {
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

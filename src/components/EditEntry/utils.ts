import { EntryFragment } from "../../graphql/apollo-types/EntryFragment";
import { DataDefinitionFragment } from "../../graphql/apollo-types/DataDefinitionFragment";
import { Dispatch, Reducer, createContext } from "react";
import immer from "immer";

export enum ActionTypes {
  EDIT_BTN_CLICKED = "@component/edit-entry/edit-btn-clicked",
  TITLE_CHANGED = "@component/edit-entry/title-changed",
  TITLE_RESET = "@component/edit-entry/title-reset",
  TITLE_EDIT_DISMISS = "@component/edit-entry/title-dismi",
}

export const y = 1 + 1;

export const initialStateFromProps = (props: Props): State => {
  const { definitions } = props;

  const initialDefinitionsStates = definitions.reduce(
    (acc, definition) => {
      acc[definition.id] = {
        state: "idle",
      };

      return acc;
    },
    {} as DefinitionsStates,
  );

  return {
    definitionsStates: initialDefinitionsStates,
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

          proxy.definitionsStates[id] = {
            state: "pristine",
          };
        }

        break;

      case ActionTypes.TITLE_CHANGED:
        {
          const { id } = payload as IdString;
          proxy.definitionsStates[id] = {
            state: "dirty",
          };
        }

        break;

      case ActionTypes.TITLE_RESET:
        {
          const { id } = payload as IdString;
          proxy.definitionsStates[id] = {
            state: "pristine",
          };
        }

        break;

      case ActionTypes.TITLE_EDIT_DISMISS:
        {
          const { id } = payload as IdString;
          proxy.definitionsStates[id].state = "idle";
        }

        break;
    }
  });
};

export const DefinitionsContext = createContext<DefinitionsContextValues>(
  {} as DefinitionsContextValues,
);

export const DefinitionsContextProvider = DefinitionsContext.Provider;

export interface State {
  readonly definitionsStates: DefinitionsStates;
}

type Action =
  | {
      type: ActionTypes.EDIT_BTN_CLICKED;
      id: string;
    }
  | {
      type: ActionTypes.TITLE_CHANGED;
      id: string;
    }
  | {
      type: ActionTypes.TITLE_RESET;
      id: string;
    }
  | {
      type: ActionTypes.TITLE_EDIT_DISMISS;
      id: string;
    };

export interface Props {
  entry: EntryFragment;
  definitions: DataDefinitionFragment[];
  onDefinitionsEdit: () => {};
}

interface OnDefinitionsEdit {}

export interface DefaultDefinitionsMap {
  [k: string]: DataDefinitionFragment;
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
  state: "idle" | "pristine" | "dirty";
}

export interface DefinitionsStates {
  [k: string]: DefinitionState;
}

interface IdString {
  id: string;
}

interface DefinitionsContextValues {
  defaultDefinitionsMap: DefaultDefinitionsMap;
  dispatch: DispatchType;
}

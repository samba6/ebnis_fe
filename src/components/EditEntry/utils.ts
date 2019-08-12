import { EntryFragment } from "../../graphql/apollo-types/EntryFragment";
import { DataDefinitionFragment } from "../../graphql/apollo-types/DataDefinitionFragment";
import { Dispatch, Reducer } from "react";
import immer from "immer";

export enum ActionTypes {
  EDIT_BTN_CLICKED = "@component/edit-entry/edit-btn-clicked",
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
          const { id } = payload as EditBtnClickedPayload;

          proxy.definitionsStates[id] = {
            state: "pristine",
          };
        }

        break;
    }
  });
};

export interface State {
  readonly definitionsStates: DefinitionsStates;
}

type Action = {
  type: ActionTypes.EDIT_BTN_CLICKED;
  id: string;
};

export interface Props {
  entry: EntryFragment;
  definitions: DataDefinitionFragment[];
}

export type DefinitionFormValue = Pick<
  DataDefinitionFragment,
  Exclude<keyof DataDefinitionFragment, "__typename" | "clientId">
>;

export interface FormValues {
  definitions: DefinitionFormValue[];
}

export type DispatchType = Dispatch<Action>;

export interface DefinitionState {
  state: "idle" | "pristine";
}

export interface DefinitionsStates {
  [k: string]: DefinitionState;
}

interface EditBtnClickedPayload {
  id: string;
}

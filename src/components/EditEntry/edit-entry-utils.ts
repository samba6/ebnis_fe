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
  TITLE_CHANGED = "@component/edit-entry/title-changed",
  TITLE_RESET = "@component/edit-entry/title-reset",
  TITLE_EDIT_DISMISS = "@component/edit-entry/title-dismiss",
  TITLE_EDIT_SUBMIT = "@component/edit-entry/title-submit",
  DESTROYED = "@component/edit-entry/destroy",
  submissionResult = "@component/edit-entry/submission-result",
}

export const initialStateFromProps = (props: Props): State => {
  const { definitions } = props;

  const initialDefinitionsStates = definitions.reduce(
    (acc, definition) => {
      acc[definition.id] = {
        state: {
          idle: {},
        },
        formValue: definition.name,
      };

      return acc;
    },
    {} as DefinitionsStates,
  );

  return {
    definitionsStates: initialDefinitionsStates,
    state: "nothing",
  };
};

export const reducer: Reducer<State, Action> = (
  prevState,
  { type, ...payload },
) => {
  return immer(prevState, proxy => {
    switch (type) {
      case ActionTypes.EDIT_BTN_CLICKED:
      case ActionTypes.TITLE_RESET:
        {
          const { id } = payload as IdString;

          proxy.definitionsStates[id].state = {
            pristine: {},
          };
        }

        break;

      case ActionTypes.TITLE_CHANGED:
        {
          const { id, formValue } = payload as TitleChangedPayload;
          const definition = proxy.definitionsStates[id];
          definition.state = {
            dirty: {},
          };
          definition.formValue = formValue;
        }

        break;

      case ActionTypes.TITLE_EDIT_DISMISS:
        {
          const { id } = payload as IdString;
          proxy.definitionsStates[id].state = {
            idle: {},
          };
        }

        break;

      case ActionTypes.TITLE_EDIT_SUBMIT:
        {
          proxy.state = "submitting";
        }

        break;

      case ActionTypes.submissionResult:
        {
          const {
            definitions,
          } = payload as UpdateDefinitions_updateDefinitions;

          definitions.forEach(def => {
            const {
              definition,
            } = def as UpdateDefinitions_updateDefinitions_definitions;

            proxy.definitionsStates[definition.id].state = {
              idle: {
                success: true,
              },
            };
          });
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
  readonly state: "nothing" | "submitting";
}

export type Action =
  | {
      type: ActionTypes.EDIT_BTN_CLICKED;
      id: string;
    }
  | {
      type: ActionTypes.TITLE_CHANGED;
    } & TitleChangedPayload
  | {
      type: ActionTypes.TITLE_RESET;
      id: string;
    }
  | {
      type: ActionTypes.TITLE_EDIT_DISMISS;
      id: string;
    }
  | {
      type: ActionTypes.TITLE_EDIT_SUBMIT;
    }
  | {
      type: ActionTypes.DESTROYED;
    }
  | {
      type: ActionTypes.submissionResult;
    } & UpdateDefinitions_updateDefinitions;

type TitleChangedPayload = {
  id: string;
  formValue: string;
};

export interface OwnProps {
  entry: EntryFragment;
  definitions: DataDefinitionFragment[];
  dispatch: DispatchType;
}

export interface Props extends OwnProps, UpdateDefinitionsMutationProps {}

export interface DefaultDefinitionsMap {
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

export interface DefinitionStateValue {
  idle: {
    success?: true;
  };

  pristine: {};

  dirty: {};
}

export interface DefinitionState {
  state:
    | DefinitionStateValue["idle"]
    | DefinitionStateValue["pristine"]
    | DefinitionStateValue["dirty"];

  formValue: string;
}

export interface DefinitionsStates {
  [k: string]: DefinitionState;
}

interface IdString {
  id: string;
}

interface DefinitionsContextValues extends UpdateDefinitionsMutationProps {
  defaultDefinitionsMap: DefaultDefinitionsMap;
  dispatch: DispatchType;
}

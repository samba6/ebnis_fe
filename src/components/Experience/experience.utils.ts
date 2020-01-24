import { RouteComponentProps } from "@reach/router";
import dateFnFormat from "date-fns/format";
import parseISO from "date-fns/parseISO";
import { DataTypes } from "../../graphql/apollo-types/globalTypes";
import { NewEntryRouteParams } from "../../routes";
import { ExperienceFragment } from "../../graphql/apollo-types/ExperienceFragment";
import { EbnisComponentProps } from "../../types";
import { PropsWithChildren, Reducer, Dispatch } from "react";
import { UpdateExperienceMutationFn } from "../../graphql/update-experience.mutation";
import {
  Action as EditExperienceAction,
  ActionType as EditExperienceActionType,
} from "../EditExperience/edit-experience.utils";
import immer, { Draft } from "immer";
import { wrapReducer } from "../../logger";

export const StateValue = {
  editing: "editing" as EditingVal,
  idle: "idle" as IdleVal,
};

export const displayFieldType = {
  [DataTypes.SINGLE_LINE_TEXT](text: string) {
    return text;
  },

  [DataTypes.MULTI_LINE_TEXT](text: string) {
    return text;
  },

  [DataTypes.DATE](text: string) {
    return dateFnFormat(new Date(text), "dd/MM/yyyy");
  },

  [DataTypes.DATETIME](text: string) {
    const date = parseISO(text);

    return formatDatetime(date);
  },

  [DataTypes.DECIMAL](text: string) {
    return Number(text);
  },

  [DataTypes.INTEGER](text: string) {
    return Number(text);
  },
};

export enum ActionType {
  EDIT_EXPERIENCE = "@experience-component/edit-experience",
}

export const reducer: Reducer<StateMachine, Action> = (state, action) =>
  wrapReducer(
    state,
    action,
    (prevState, { type }) => {
      return immer(prevState, proxy => {
        switch (type) {
          case EditExperienceActionType.COMPLETED:
          case EditExperienceActionType.ABORTED:
            proxy.states.editingExperience.value = StateValue.idle;
            break;

          case ActionType.EDIT_EXPERIENCE:
            proxy.states.editingExperience.value = StateValue.editing;
            break;
        }
      });
    },

    // true
  );

////////////////////////// STATE UPDATE SECTION /////////////////////
export function initState(): StateMachine {
  return {
    states: {
      editingExperience: { value: StateValue.idle },
    },
  };
}
////////////////////////// END STATE UPDATE SECTION /////////////////

export function formatDatetime(date: Date | string) {
  date = typeof date === "string" ? parseISO(date) : date;
  return dateFnFormat(date, "dd/MM/yyyy HH:mm:ss");
}

////////////////////////// TYPES SECTION ///////////////////////

type DraftState = Draft<StateMachine>;

export interface StateMachine {
  readonly states: {
    editingExperience: { value: IdleVal } | { value: EditingVal };
  };
}

////////////////////////// STRINGY TYPES SECTION /////////////////////////
type EditingVal = "editing";
type IdleVal = "idle";
////////////////////////// END STRINGY TYPES SECTION ////////////////////

type Action =
  | EditExperienceAction
  | {
      type: ActionType.EDIT_EXPERIENCE;
    };

export type DispatchType = Dispatch<Action>;

export interface IMenuOptions {
  newEntry?: boolean;
  onDelete: (id: string) => void;
  onEdit?: UpdateExperienceMutationFn;
}

export interface CallerProps
  extends EbnisComponentProps,
    RouteComponentProps<NewEntryRouteParams>,
    PropsWithChildren<{}> {
  experience: ExperienceFragment;
  entryProps?: EbnisComponentProps;
  headerProps?: EbnisComponentProps;
  menuOptions: IMenuOptions;
  entriesJSX?: JSX.Element | JSX.Element[];
}

export type Props = CallerProps & {
  hasConnection: boolean;
};

export type FormObjVal = number | Date | string;
export interface FormObj {
  [k: string]: FormObjVal;
}

export interface FieldComponentProps {
  name: string;
  onChange: (formName: string, value: FormObjVal) => void;
}

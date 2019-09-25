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
  EditExperienceAction,
  EditExperienceActionType,
} from "../EditExperience/edit-experience.component";

export interface IMenuOptions {
  newEntry?: boolean;
  onDelete: (id: string) => void;
  onEdit?: UpdateExperienceMutationFn;
}

export interface Props
  extends EbnisComponentProps,
    RouteComponentProps<NewEntryRouteParams>,
    PropsWithChildren<{}> {
  experience: ExperienceFragment;
  entryProps?: EbnisComponentProps;
  headerProps?: EbnisComponentProps;
  menuOptions: IMenuOptions;
  entriesJSX?: JSX.Element | JSX.Element[];
}

export type FormObjVal = number | Date | string;
export interface FormObj {
  [k: string]: FormObjVal;
}

export interface FieldComponentProps {
  name: string;
  onChange: (formName: string, value: FormObjVal) => void;
}

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

export function formatDatetime(date: Date | string) {
  date = typeof date === "string" ? parseISO(date) : date;
  return dateFnFormat(date, "dd/MM/yyyy HH:mm:ss");
}

export enum EditingState {
  editingExperience = "editing-experience",
  notEditing = "not-editing",
}

export const reducer: Reducer<State, Action> = (prevState, [type]) => {
  switch (type) {
    case EditExperienceActionType.completed:
    case EditExperienceActionType.aborted: {
      return {
        ...prevState,
        editingState: [EditingState.notEditing],
      };
    }

    case "show-editor": {
      return {
        ...prevState,
        editingState: [EditingState.editingExperience],
      };
    }

    default:
      return prevState;
  }
};

export interface State {
  readonly editingState:
    | [EditingState.notEditing]
    | [EditingState.editingExperience];
}

type Action = EditExperienceAction | ["show-editor"];

export type DispatchType = Dispatch<Action>;

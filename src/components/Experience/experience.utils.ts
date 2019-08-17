import { RouteComponentProps } from "@reach/router";
import dateFnParse from "date-fns/parse";
import dateFnFormat from "date-fns/format";
import { FieldType } from "../../graphql/apollo-types/globalTypes";
import { NewEntryRouteParams } from "../../routes";
import { ExperienceFragment } from "../../graphql/apollo-types/ExperienceFragment";
import { EbnisComponentProps } from "../../types";
import { PropsWithChildren, Reducer, Dispatch } from "react";
import { UpdateExperienceMutationFn } from "../../graphql/update-experience.mutation";
import {
  EditExperienceAction,
  EditExperienceActionType,
} from "../EditExperience/edit-experience.utils";
import { EntryAction } from "../Entry/entry.utils";

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

export type FormObjVal = Date | string;
export interface FormObj {
  [k: string]: FormObjVal;
}

export interface FieldComponentProps {
  name: string;
  setValue: (formName: string, value: FormObjVal) => void;
}

export const displayFieldType = {
  [FieldType.SINGLE_LINE_TEXT](text: string) {
    return text;
  },

  [FieldType.MULTI_LINE_TEXT](text: string) {
    return text;
  },

  [FieldType.DATE](text: string) {
    const date = dateFnParse(text);

    return dateFnFormat(date, "DD/MM/YYYY");
  },

  [FieldType.DATETIME](text: string) {
    const date = dateFnParse(text);

    return formatDatetime(date);
  },

  [FieldType.DECIMAL](text: string) {
    return Number(text);
  },

  [FieldType.INTEGER](text: string) {
    return Number(text);
  },
};

export function formatDatetime(date: string | Date) {
  return dateFnFormat(date, "DD/MM/YYYY HH:mm:ss");
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

type Action = EditExperienceAction | ["show-editor"] | EntryAction;

export type DispatchType = Dispatch<Action>;

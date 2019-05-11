import { RouteComponentProps } from "@reach/router";
import * as Yup from "yup";
import { DropdownItemProps } from "semantic-ui-react";
import { MutationUpdaterFn } from "react-apollo";
import { Reducer } from "react";
import { FormikErrors } from "formik";

import { CreateExpMutationProps } from "../../graphql/create-exp.mutation";
import {
  CreateExp as FormValues,
  CreateFieldDef,
  FieldType
} from "../../graphql/apollo-types/globalTypes";
import { WithSideBar } from "../SidebarHeader/sidebar-header";
import { CreateExpMutation } from "../../graphql/apollo-types/CreateExpMutation";

export type CreateExpUpdateFn = MutationUpdaterFn<CreateExpMutation>;

export interface OwnProps extends RouteComponentProps<{}> {
  createExpUpdate?: CreateExpUpdateFn;
}

export interface Props extends WithSideBar, OwnProps, CreateExpMutationProps {}

const fieldTypeKeys = Object.values(FieldType);

export const ValidationSchema = Yup.object<FormValues>().shape({
  title: Yup.string()
    .required()
    .min(2),
  fieldDefs: Yup.array<CreateFieldDef>()
    .of<CreateFieldDef>(
      Yup.object<CreateFieldDef>().shape({
        name: Yup.string()
          .required()
          .min(2),
        type: Yup.mixed().oneOf(
          fieldTypeKeys,
          // eslint-disable-next-line
          "${path} please select from dropdown"
        )
      })
    )
    .required()
    .min(1)
    .ensure()
});

export const FIELD_TYPES: DropdownItemProps[] = [];

for (const k of fieldTypeKeys) {
  FIELD_TYPES.push({
    value: k,
    text: k,
    key: k
  });
}

export interface Action {
  type: Action_Types;
  payload?:
    | undefined
    | boolean
    | FormikErrors<FormValues>
    | GraphQlErrorState
    | SelectFieldTypeState;
}

export interface State {
  readonly otherErrors?: string;
  readonly submittedFormErrors?: FormikErrors<FormValues>;
  readonly graphQlError?: GraphQlErrorState;
  readonly showDescriptionInput: boolean;
  readonly selectValues: SelectFieldTypeState;
}

export const reducer: Reducer<State, Action> = (state, action) => {
  switch (action.type) {
    case Action_Types.RESET_FORM_ERRORS:
      return {
        ...state,
        otherErrors: undefined,
        submittedFormErrors: undefined,
        graphQlError: undefined
      };

    case Action_Types.SET_OTHER_ERRORS:
      return { ...state, otherErrors: action.payload as string };

    case Action_Types.SET_FORM_ERROR:
      return {
        ...state,
        submittedFormErrors: action.payload as FormikErrors<FormValues>
      };

    case Action_Types.SET_GRAPHQL_ERROR:
      return { ...state, graphQlError: action.payload as GraphQlErrorState };

    case Action_Types.SET_SHOW_DESCRIPTION_INPUT:
      return { ...state, showDescriptionInput: action.payload as boolean };

    case Action_Types.SELECT_VALUES:
      return { ...state, selectValues: action.payload as SelectFieldTypeState };

    default:
      return state;
  }
};

export const EMPTY_FIELD = { name: "", type: "" as FieldType };

export enum Action_Types {
  SET_OTHER_ERRORS = "@new-exp/SET_OTHER_ERRORS",
  SET_FORM_ERROR = "@new-exp/SET_FORM_ERROR",
  SET_GRAPHQL_ERROR = "@new-exp/SET_GRAPHQL_ERROR",
  SET_SHOW_DESCRIPTION_INPUT = "@new-exp/SET_SHOW_DESCRIPTION_INPUT",
  SELECT_VALUES = "@new-exp/SELECT_VALUES",
  RESET_FORM_ERRORS = "@new-exp/RESET_FORM_ERRORS"
}

export interface SelectFieldTypeState {
  [k: number]: string | null;
}

export interface GraphQlError {
  field_defs?: Array<{ name?: string; type?: string }>;
  title?: string;
}

export type GraphQlErrorState = { [k: string]: string } & {
  fieldDefs?: {
    [k: number]: string;
  };
};

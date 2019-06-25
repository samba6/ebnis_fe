import { RouteComponentProps } from "@reach/router";
import * as Yup from "yup";
import { DropdownItemProps } from "semantic-ui-react";
import { MutationUpdaterFn } from "react-apollo";
import { Reducer } from "react";
import { FormikErrors } from "formik";

import { CreateExperienceMutationProps } from "../../graphql/create-experience.mutation";
import {
  CreateExp as FormValues,
  CreateFieldDef,
  FieldType
} from "../../graphql/apollo-types/globalTypes";
import { CreateExperienceMutation } from "../../graphql/apollo-types/CreateExperienceMutation";
import { CreateUnsavedExperienceMutationProps } from "./resolvers";
import { WithApolloClient } from "react-apollo";

export type CreateExpUpdateFn = MutationUpdaterFn<CreateExperienceMutation>;

export interface OwnProps
  extends RouteComponentProps<{}>,
    WithApolloClient<{}> {}

export interface Props
  extends OwnProps,
    CreateExperienceMutationProps,
    CreateUnsavedExperienceMutationProps {}

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
  payload?: undefined | boolean | FormikErrors<FormValues> | GraphQlErrorState;
}

export interface State {
  readonly otherErrors?: string;
  readonly submittedFormErrors?: FormikErrors<FormValues>;
  readonly graphQlError?: GraphQlErrorState;
  readonly showDescriptionInput: boolean;
}

export const reducer: Reducer<State, Action> = (state, action) => {
  switch (action.type) {
    case Action_Types.CLEAR_ALL_ERRORS:
      return {
        ...state,
        otherErrors: undefined,
        submittedFormErrors: undefined,
        graphQlError: undefined
      };

    case Action_Types.SET_FORM_ERROR:
      return {
        ...state,
        submittedFormErrors: action.payload as FormikErrors<FormValues>
      };

    case Action_Types.SET_GRAPHQL_ERROR:
      return { ...state, graphQlError: action.payload as GraphQlErrorState };

    case Action_Types.SET_SHOW_DESCRIPTION_INPUT:
      return { ...state, showDescriptionInput: action.payload as boolean };

    // istanbul ignore next - trust React.useReducer
    default:
      return state;
  }
};

export const EMPTY_FIELD = { name: "", type: "" as FieldType };

export enum Action_Types {
  SET_FORM_ERROR = "@components/new-experience/SET_FORM_ERROR",

  SET_GRAPHQL_ERROR = "@components/new-experience/SET_GRAPHQL_ERROR",

  SET_SHOW_DESCRIPTION_INPUT = "@components/new-experience/SET_SHOW_DESCRIPTION_INPUT",

  SELECT_VALUES = "@components/new-experience/SELECT_VALUES",

  CLEAR_ALL_ERRORS = "@components/new-experience/CLEAR_ALL_ERRORS"
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

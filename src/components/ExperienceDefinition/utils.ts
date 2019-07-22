import { RouteComponentProps } from "@reach/router";
import * as Yup from "yup";
import { MutationUpdaterFn } from "react-apollo";
import { Reducer } from "react";
import { FormikErrors } from "formik";
import immer from "immer";
import { CreateExperienceMutationProps } from "../../graphql/create-experience.mutation";
import {
  CreateExperienceInput as FormValues,
  CreateFieldDef,
  FieldType,
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

export const fieldTypeKeys = Object.values(FieldType);

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
          "${path} please select from dropdown",
        ),
      }),
    )
    .required()
    .min(1)
    .ensure(),
});

export enum ActionType {
  setFormError = "@components/new-experience/SET_FORM_ERROR",

  setGraphqlError = "@components/new-experience/SET_GRAPHQL_ERROR",

  showDescriptionInput = "@components/new-experience/SET_SHOW_DESCRIPTION_INPUT",

  clearAllErrors = "@components/new-experience/CLEAR_ALL_ERRORS",
}

export interface State {
  readonly otherErrors?: string | null;
  readonly submittedFormErrors?: FormikErrors<FormValues> | null;
  readonly graphQlError?: GraphQlErrorState | null;
  readonly showDescriptionInput: boolean;
}

export type Action =
  | [ActionType.setFormError, FormikErrors<FormValues>]
  | [ActionType.setGraphqlError, GraphQlErrorState | null]
  | [ActionType.showDescriptionInput, boolean]
  | [ActionType.clearAllErrors];

export const reducer: Reducer<State, Action> = (prevState, [type, payload]) => {
  return immer(prevState, proxy => {
    switch (type) {
      case ActionType.clearAllErrors:
        {
          proxy.otherErrors = null;
          proxy.submittedFormErrors = null;
          proxy.graphQlError = null;
        }

        break;

      case ActionType.setFormError:
        {
          proxy.submittedFormErrors = payload as FormikErrors<FormValues>;
        }

        break;

      case ActionType.setGraphqlError:
        {
          proxy.graphQlError = payload as GraphQlErrorState;
        }

        break;

      case ActionType.showDescriptionInput:
        {
          proxy.showDescriptionInput = payload as boolean;
        }

        break;
    }
  });
};

export const EMPTY_FIELD = { name: "", type: "" as FieldType };

export interface GraphQlError {
  field_defs?: { name?: string; type?: string }[];
  title?: string;
}

export type GraphQlErrorState = { [k: string]: string } & {
  fieldDefs?: {
    [k: number]: string;
  };
};

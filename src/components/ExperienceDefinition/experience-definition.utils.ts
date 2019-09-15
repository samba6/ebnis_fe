import { RouteComponentProps } from "@reach/router";
import * as Yup from "yup";
import { MutationUpdaterFn } from "react-apollo";
import { Reducer, Dispatch } from "react";
import { FormikErrors } from "formik";
import immer from "immer";
import { CreateExperienceMutationProps } from "../../graphql/create-experience.mutation";
import {
  CreateExperienceInput as FormValues,
  CreateDataDefinition,
  DataTypes,
} from "../../graphql/apollo-types/globalTypes";
import {
  CreateExperienceMutation,
  CreateExperienceMutation_createExperience_errors,
  CreateExperienceMutation_createExperience_errors_dataDefinitionsErrors_errors,
  CreateExperienceMutation_createExperience_errors_dataDefinitionsErrors,
} from "../../graphql/apollo-types/CreateExperienceMutation";
import { CreateUnsavedExperienceMutationProps } from "./resolvers";
import { WithApolloClient } from "react-apollo";
import { ApolloError } from "apollo-client";

export type CreateExpUpdateFn = MutationUpdaterFn<CreateExperienceMutation>;

export interface OwnProps
  extends RouteComponentProps<{}>,
    WithApolloClient<{}> {}

export interface Props
  extends OwnProps,
    CreateExperienceMutationProps,
    CreateUnsavedExperienceMutationProps {}

export const fieldTypeKeys = Object.values(DataTypes);

export const ValidationSchema = Yup.object().shape<FormValues>({
  title: Yup.string()
    .required()
    .min(2),
  dataDefinitions: Yup.array<CreateDataDefinition>()
    .of<CreateDataDefinition>(
      Yup.object<CreateDataDefinition>().shape({
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
  setFormError = "@components/experience-definition/set-form-error",

  setApolloError = "@components/experience-definition/set-apollo-error",

  showDescriptionInput = "@components/experience-definition/set-show-description-input",

  clearAllErrors = "@components/experience-definition/clear-all-errors",

  setFieldErrors = "@components/experience-definition/set-field-errors",
}

export type Action =
  | [ActionType.setFormError, FormikErrors<FormValues>]
  | [ActionType.setApolloError, ApolloError]
  | [ActionType.showDescriptionInput, boolean]
  | [ActionType.clearAllErrors]
  | [
      ActionType.setFieldErrors,
      CreateExperienceMutation_createExperience_errors,
    ];

export const reducer: Reducer<State, Action> = (prevState, [type, payload]) => {
  return immer(prevState, proxy => {
    switch (type) {
      case ActionType.clearAllErrors:
        {
          proxy.otherErrors = null;
          proxy.submittedFormErrors = null;
          proxy.graphQlError = null;
          proxy.serverOtherErrorsMap = null;
          proxy.serverDataDefinitionsErrorsMap = null;
        }

        break;

      case ActionType.setFieldErrors:
        {
          const errors = normalizeServerFieldsErrors(
            payload as CreateExperienceMutation_createExperience_errors,
          );

          proxy.serverOtherErrorsMap = errors.serverOtherErrorsMap;
          proxy.serverDataDefinitionsErrorsMap =
            errors.serverDataDefinitionsErrorsMap;
        }

        break;

      case ActionType.setFormError:
        {
          proxy.submittedFormErrors = payload as FormikErrors<FormValues>;
        }

        break;

      case ActionType.setApolloError:
        {
          const { networkError, graphQLErrors } = payload as ApolloError;
          proxy.graphQlError =
            (networkError && networkError.message) ||
            (graphQLErrors && graphQLErrors[0].message);
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

export const EMPTY_FIELD = { name: "", type: "" as DataTypes };

function normalizeServerFieldsErrors(
  serverFieldErrors: CreateExperienceMutation_createExperience_errors,
) {
  const { dataDefinitionsErrors, ...serverOtherErrorsMap } = serverFieldErrors;

  return {
    serverOtherErrorsMap,
    serverDataDefinitionsErrorsMap: (dataDefinitionsErrors || []).reduce(
      (acc, val) => {
        const {
          index,
          errors,
        } = val as CreateExperienceMutation_createExperience_errors_dataDefinitionsErrors;

        acc[index] = errors;

        return acc;
      },
      {} as ServerDataDefinitionsErrorsMap,
    ),
  };
}

export interface ServerDataDefinitionsErrorsMap {
  [k: string]: CreateExperienceMutation_createExperience_errors_dataDefinitionsErrors_errors;
}

type ServerOtherErrorsMap = Pick<
  CreateExperienceMutation_createExperience_errors,
  Exclude<
    keyof CreateExperienceMutation_createExperience_errors,
    "dataDefinitionsErrors"
  >
>;

export interface GraphQlError {
  field_defs?: { name?: string; type?: string }[];
  title?: string;
}

export type FormErrors = FormikErrors<FormValues>;

export interface State {
  readonly otherErrors?: string | null;
  readonly submittedFormErrors?: FormErrors | null;
  readonly graphQlError?: string | null;
  readonly showDescriptionInput: boolean;
  readonly serverOtherErrorsMap?: ServerOtherErrorsMap | null;
  readonly serverDataDefinitionsErrorsMap?: ServerDataDefinitionsErrorsMap | null;
}

export type DispatchType = Dispatch<Action>;

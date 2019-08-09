import { RouteComponentProps } from "@reach/router";
import { Reducer, Dispatch } from "react";

import { NewEntryRouteParams } from "../../routes";
import { CreateEntryMutationProps } from "../../graphql/create-entry.mutation";
import { WithApolloClient } from "react-apollo";
import { CreateUnsavedEntryMutationProps } from "./resolvers";
import {
  ExperienceFragment,
  ExperienceFragment_dataDefinitions,
} from "../../graphql/apollo-types/ExperienceFragment";
import immer from "immer";
import { ApolloError } from "apollo-client";
import { FieldType } from "../../graphql/apollo-types/globalTypes";
import {
  CreateEntryMutation_createEntry_errors,
  CreateEntryMutation_createEntry_errors_dataObjectsErrors,
} from "../../graphql/apollo-types/CreateEntryMutation";

export interface OwnProps
  extends WithApolloClient<{}>,
    RouteComponentProps<NewEntryRouteParams> {
  experience: ExperienceFragment;
}

export interface Props
  extends OwnProps,
    CreateEntryMutationProps,
    CreateUnsavedEntryMutationProps {}

export type FormObjVal = Date | string | number;

// the keys are the indices of the field definitions and the values are the
// default values for each field data type e.g number for integer and date
// for date
export interface FormObj {
  [k: string]: FormObjVal;
}

export interface FieldComponentProps {
  formFieldName: string;
  dispatch: DispatchType;
  value: FormObjVal;
}

export type ToString = (val: FormObjVal) => string;

export function initialStateFromProps(experience: ExperienceFragment) {
  const dataDefinitions = experience.dataDefinitions as ExperienceFragment_dataDefinitions[];

  const formObj = dataDefinitions.reduce(
    function fieldDefReducer(acc, field, index) {
      const value =
        field.type === FieldType.DATE || field.type === FieldType.DATETIME
          ? new Date()
          : "";

      acc[index] = value;

      return acc;
    },
    {} as FormObj,
  );

  return {
    formObj,
    fieldErrors: {},
  };
}

export function makePageTitle(exp: ExperienceFragment | null | undefined) {
  return "[New Entry] " + ((exp && exp.title) || "entry");
}

export function formFieldNameFromIndex(index: number) {
  return `fields[${index}]`;
}

function formFieldNameToIndex(formFieldName: string) {
  const index = (/fields.+(\d+)/.exec(formFieldName) as RegExpExecArray)[1];

  return index;
}

export enum ActionTypes {
  setFormObjField = "@components/new-entry/set-form-obj-field",
  setServerErrors = "@components/new-entry/set-server-errors",
  setCreateEntryErrors = "@components/new-entry/set-create-entry-errors",
  removeServerErrors = "@components/new-entry/unset-server-errors",
}

interface SetFormObjFieldPayload {
  formFieldName: string;
  value: FormObjVal;
}

interface FieldErrors {
  [k: string]: string;
}

interface ServerErrors {
  networkError?: string;
  fieldErrors?: FieldErrors;
}

export interface State {
  readonly formObj: FormObj;
  readonly fieldErrors: FieldErrors;
  readonly networkError?: string | null;
}

type Action =
  | [ActionTypes.setFormObjField, SetFormObjFieldPayload]
  | [ActionTypes.setServerErrors, ServerErrors]
  | [ActionTypes.removeServerErrors]
  | [ActionTypes.setCreateEntryErrors, CreateEntryMutation_createEntry_errors];

export const reducer: Reducer<State, Action> = (prevState, [type, payload]) => {
  return immer(prevState, proxy => {
    switch (type) {
      case ActionTypes.setFormObjField:
        {
          const { formFieldName, value } = payload as SetFormObjFieldPayload;

          proxy.formObj[formFieldNameToIndex(formFieldName)] = value;
        }

        break;

      case ActionTypes.setCreateEntryErrors:
        {
          const {
            dataObjectsErrors,
          } = payload as CreateEntryMutation_createEntry_errors;

          if (!dataObjectsErrors) {
            return;
          }

          const fieldErrors = dataObjectsErrors.reduce((acc, field) => {
            const {
              errors,
              index,
            } = field as CreateEntryMutation_createEntry_errors_dataObjectsErrors;

            acc[index] = Object.entries(errors).reduce((a, [k, v]) => {
              if (v) {
                a += `\n${k}: ${v}`;
              }

              return a;
            }, "");

            return acc;
          }, {});

          proxy.fieldErrors = fieldErrors;
        }

        break;

      case ActionTypes.setServerErrors:
        {
          const { fieldErrors, networkError } = payload as ServerErrors;

          if (fieldErrors) {
            proxy.fieldErrors = fieldErrors;
          } else if (networkError) {
            proxy.networkError = networkError;
          }
        }

        break;

      case ActionTypes.removeServerErrors:
        {
          proxy.networkError = null;
          proxy.fieldErrors = {};
        }

        break;
    }
  });
};

export function parseApolloErrors(payload: ApolloError) {
  const { graphQLErrors, networkError } = payload as ApolloError;

  if (networkError) {
    return { networkError: "Network error!" };
  }
  return { networkError: graphQLErrors[0].message };
}

export type DispatchType = Dispatch<Action>;

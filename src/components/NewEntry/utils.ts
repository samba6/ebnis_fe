import { RouteComponentProps } from "@reach/router";
import { Reducer, Dispatch } from "react";

import { NewEntryRouteParams } from "../../routes";
import { CreateEntryMutationProps } from "../../graphql/create-entry.mutation";
import { fieldTypeUtils } from "./field-types-utils";
import { WithApolloClient } from "react-apollo";
import { CreateUnsavedEntryMutationProps } from "./resolvers";
import {
  ExperienceFragment,
  ExperienceFragment_fieldDefs
} from "../../graphql/apollo-types/ExperienceFragment";
import immer from "immer";
import { ApolloError } from "apollo-client";

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

function initialFormValuesFromExperience(exp: ExperienceFragment) {
  const fieldDefs = exp.fieldDefs as ExperienceFragment_fieldDefs[];

  return fieldDefs.reduce(
    function fieldDefReducer(acc, field, index) {
      acc[index] = fieldTypeUtils[
        (field as ExperienceFragment_fieldDefs).type
      ].default();
      return acc;
    },
    {} as FormObj
  );
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
  experienceToFormValues = "@components/new-entry/experience-to-form-values",
  setServerErrors = "@components/new-entry/set-server-errors",
  removeServerErrors = "@components/new-entry/unset-server-errors"
}

interface SetFormObjFieldPayload {
  formFieldName: string;
  value: FormObjVal;
}

interface ExperienceToFormValuesPayload {
  experience: ExperienceFragment;
}

export interface Action {
  type: ActionTypes;
  payload:
    | null
    | undefined
    | SetFormObjFieldPayload
    | ExperienceToFormValuesPayload
    | ServerErrors;
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

export const reducer: Reducer<State, Action> = function reducerFn(
  prevState,
  { type, payload }
) {
  return immer(prevState, proxy => {
    switch (type) {
      case ActionTypes.setFormObjField:
        {
          const { formFieldName, value } = payload as SetFormObjFieldPayload;

          proxy.formObj[formFieldNameToIndex(formFieldName)] = value;
        }

        break;

      case ActionTypes.experienceToFormValues:
        {
          proxy.formObj = initialFormValuesFromExperience(
            (payload as ExperienceToFormValuesPayload).experience
          );
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

  try {
    const { fields } = JSON.parse(
      graphQLErrors[0].message
    ) as CreateEntryFieldErrors;

    const fieldErrors = fields.reduce((acc, field) => {
      const [[k, v]] = Object.entries(field.errors);

      acc[field.meta.def_id] = `${k}: ${v}`;
      return acc;
    }, {});

    return { fieldErrors };
  } catch (error) {
    return { networkError: "Network error!" };
  }
}

export type DispatchType = Dispatch<Action>;

export interface CreateEntryFieldErrors {
  fields: Array<{
    errors: {
      data: string;
    };

    meta: {
      def_id: string;
      index: number;
    };
  }>;
}

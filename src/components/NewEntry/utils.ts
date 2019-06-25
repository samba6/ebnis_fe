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

export enum Action_Types {
  setFormObjField = "@components/new-entry/set-form-obj-field",
  experienceToFormValues = "@components/new-entry/experience-to-form-values"
}

interface SetFormObjFieldPayload {
  formFieldName: string;
  value: FormObjVal;
}

interface ExperienceToFormValuesPayload {
  experience: ExperienceFragment;
}

export interface Action {
  type: Action_Types;
  payload:
    | null
    | undefined
    | SetFormObjFieldPayload
    | ExperienceToFormValuesPayload;
}

export interface State {
  readonly formObj: FormObj;
}

export const reducer: Reducer<State, Action> = function reducerFn(
  prevState,
  { type, payload }
) {
  switch (type) {
    case Action_Types.setFormObjField:
      const { formFieldName, value } = payload as SetFormObjFieldPayload;

      return {
        ...prevState,
        formObj: {
          ...prevState.formObj,
          [formFieldNameToIndex(formFieldName)]: value
        }
      };

    case Action_Types.experienceToFormValues:
      return {
        ...prevState,
        formObj: initialFormValuesFromExperience(
          (payload as ExperienceToFormValuesPayload).experience
        )
      };

    // istanbul ignore next: redux magic
    default:
      return prevState;
  }
};

export type DispatchType = Dispatch<Action>;

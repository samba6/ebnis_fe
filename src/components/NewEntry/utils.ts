import { RouteComponentProps } from "@reach/router";
import { Reducer, Dispatch } from "react";

import { GetExperienceGqlProps } from "../../graphql/get-exp.query";
import { NewEntryRouteParams } from "../../routes";
import { CreateEntryGqlProps } from "../../graphql/create-entry.mutation";
import {
  GetAnExp_exp,
  GetAnExp_exp_fieldDefs
} from "../../graphql/apollo-types/GetAnExp";
import { fieldTypeUtils } from "./field-types-utils";

export interface OwnProps extends RouteComponentProps<NewEntryRouteParams> {}

export interface Props
  extends OwnProps,
    GetExperienceGqlProps,
    CreateEntryGqlProps {}

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

function initialFormValuesFromExperience(exp: GetAnExp_exp) {
  const fieldDefs = exp.fieldDefs as GetAnExp_exp_fieldDefs[];

  return fieldDefs.reduce(
    function fieldDefReducer(acc, field, index) {
      acc[index] =
        fieldTypeUtils[(field as GetAnExp_exp_fieldDefs).type].default;
      return acc;
    },
    {} as FormObj
  );
}

export function pageTitle(exp: GetAnExp_exp | null | undefined) {
  return "New " + ((exp && exp.title) || "entry");
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
  experience: GetAnExp_exp;
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

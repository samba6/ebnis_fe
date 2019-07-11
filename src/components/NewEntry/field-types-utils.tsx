import React from "react";
import dateFnFormat from "date-fns/format";
import Input from "semantic-ui-react/dist/commonjs/elements/Input";
import TextArea from "semantic-ui-react/dist/commonjs/addons/TextArea";
import { FieldType } from "../../graphql/apollo-types/globalTypes";
import DateField from "../DateField";
import DateTimeField from "../DateTimeField";
import {
  FieldComponentProps,
  ActionTypes,
  DispatchType,
  FormObjVal,
} from "./utils";

export const fieldTypeUtils = {
  [FieldType.SINGLE_LINE_TEXT]: {
    component({ formFieldName: name, dispatch, value }: FieldComponentProps) {
      return (
        <Input
          id={name}
          name={name}
          value={value}
          fluid={true}
          onChange={(e, { value: inputVal }) => {
            dispatch([
              ActionTypes.setFormObjField,
              { formFieldName: name, value: inputVal },
            ]);
          }}
        />
      );
    },

    default: () => "",

    toString(text: string) {
      return text;
    },
  },

  [FieldType.MULTI_LINE_TEXT]: {
    component({ formFieldName: name, dispatch, value }: FieldComponentProps) {
      return (
        <TextArea
          id={name}
          name={name}
          value={value as string}
          onChange={(e, { value: inputVal }) => {
            dispatch([
              ActionTypes.setFormObjField,
              { formFieldName: name, value: inputVal as string },
            ]);
          }}
        />
      );
    },

    default: () => "",

    toString(text: string) {
      return text;
    },
  },

  [FieldType.DATE]: {
    component({
      value,
      dispatch,
      formFieldName,
      ...props
    }: FieldComponentProps) {
      return (
        <DateField
          value={value as Date}
          name={formFieldName}
          setValue={makeSetValueFunc(dispatch)}
          {...props}
        />
      );
    },

    default: () => new Date(),

    toString(date: Date) {
      return dateFnFormat(date, "YYYY-MM-DD");
    },
  },

  [FieldType.DATETIME]: {
    component({
      value,
      dispatch,
      formFieldName,
      ...props
    }: FieldComponentProps) {
      return (
        <DateTimeField
          value={value as Date}
          name={formFieldName}
          setValue={makeSetValueFunc(dispatch)}
          {...props}
        />
      );
    },

    default: () => new Date(),

    toString(date: Date) {
      return date.toJSON();
    },
  },

  [FieldType.DECIMAL]: {
    component({ formFieldName: name, value, dispatch }: FieldComponentProps) {
      return (
        <Input
          type="number"
          id={name}
          name={name}
          value={value}
          fluid={true}
          onChange={(e, { value: inputVal }) => {
            dispatch([
              ActionTypes.setFormObjField,
              { formFieldName: name, value: Number(inputVal) },
            ]);
          }}
        />
      );
    },

    default: () => "",

    toString(val: number) {
      return (val || 0) + "";
    },
  },

  [FieldType.INTEGER]: {
    component({ formFieldName: name, value, dispatch }: FieldComponentProps) {
      return (
        <Input
          type="number"
          id={name}
          name={name}
          value={value}
          fluid={true}
          onChange={(e, { value: inputVal }) => {
            dispatch([
              ActionTypes.setFormObjField,
              { formFieldName: name, value: Number(inputVal) },
            ]);
          }}
        />
      );
    },

    default: () => "",

    toString(val: number) {
      return (val || 0) + "";
    },
  },
};

function makeSetValueFunc(dispatch: DispatchType) {
  return function SetValue(fieldName: string, value: FormObjVal) {
    dispatch([
      ActionTypes.setFormObjField,
      { formFieldName: fieldName, value },
    ]);
  };
}

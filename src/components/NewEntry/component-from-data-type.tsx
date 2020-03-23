import React from "react";
import { EbnisComponentProps } from "../../types";
import { DateField } from "../DateField/date-field.component";
import { DateTimeField } from "../DateTimeField/date-time-field.component";
import { DataTypes } from "../../graphql/apollo-types/globalTypes";

const componentsObject: {
  [k: string]: (props: EbnisComponentProps) => JSX.Element;
} = {
  [DataTypes.DECIMAL]: props => (
    <input className="form__control" type="number" {...props} />
  ),

  [DataTypes.INTEGER]: props => (
    <input className="form__control" type="number" {...props} />
  ),

  [DataTypes.SINGLE_LINE_TEXT]: props => (
    <input className="form__control" {...props} />
  ),

  [DataTypes.MULTI_LINE_TEXT]: ({ value, ...props }) => {
    return (
      <textarea
        className="form__control"
        {...props}
        value={value.replace(/\\n/g, "\n")}
      />
    );
  },

  [DataTypes.DATE]: props => <DateField {...props} />,

  [DataTypes.DATETIME]: props => <DateTimeField {...props} />,
};

export function componentFromDataType(
  type: string,
  props: EbnisComponentProps,
) {
  return componentsObject[type](props);
}

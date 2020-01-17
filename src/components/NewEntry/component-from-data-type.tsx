import React from "react";
import { EbnisComponentProps } from "../../types";
import Input from "semantic-ui-react/dist/commonjs/elements/Input";
import TextArea from "semantic-ui-react/dist/commonjs/addons/TextArea";
import { DateField } from "../DateField/date-field.component";
import { DateTimeField } from "../DateTimeField/date-time-field.component";
import { DataTypes } from "../../graphql/apollo-types/globalTypes";

const componentsObject: {
  [k: string]: (props: EbnisComponentProps) => JSX.Element;
} = {
  [DataTypes.DECIMAL]: props => <Input type="number" fluid={true} {...props} />,

  [DataTypes.INTEGER]: props => <Input type="number" fluid={true} {...props} />,

  [DataTypes.SINGLE_LINE_TEXT]: props => <Input fluid={true} {...props} />,

  [DataTypes.MULTI_LINE_TEXT]: ({ value, ...props }) => {
    return <TextArea {...props} value={value.replace(/\\n/g, '\n')} />;
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

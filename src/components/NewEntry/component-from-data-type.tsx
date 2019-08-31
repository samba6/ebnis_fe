import React from "react";
import { EbnisComponentProps } from "../../types";
import Input from "semantic-ui-react/dist/commonjs/elements/Input";
import TextArea from "semantic-ui-react/dist/commonjs/addons/TextArea";
import { DateField } from "../DateField/date-field.component";
import { DateTimeField } from "../DateTimeField/date-time-field.component";
import { FieldType } from "../../graphql/apollo-types/globalTypes";

const componentsObject: {
  [k: string]: (props: EbnisComponentProps) => JSX.Element;
} = {
  [FieldType.DECIMAL]: props => <Input type="number" fluid={true} {...props} />,

  [FieldType.INTEGER]: props => <Input type="number" fluid={true} {...props} />,

  [FieldType.SINGLE_LINE_TEXT]: props => <Input fluid={true} {...props} />,

  [FieldType.MULTI_LINE_TEXT]: props => <TextArea {...props} />,

  [FieldType.DATE]: props => <DateField {...props} />,

  [FieldType.DATETIME]: props => <DateTimeField {...props} />,
};

export function componentFromDataType(
  type: string,
  props: EbnisComponentProps,
) {
  return componentsObject[type](props);
}

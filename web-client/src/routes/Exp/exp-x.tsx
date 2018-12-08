import React, { useEffect, useState } from "react";
import { Form, Input } from "semantic-ui-react";

import "./exp.scss";
import { Props, FieldComponentProps, FormObj, FormObjVal } from "./exp";
import Header from "../../components/Header";
import { setTitle } from "../../Routing";
import Loading from "../../components/Loading";
import { GetAnExp_exp_fieldDefs, FieldType } from "../../graphql/apollo-gql.d";
import DateField from "../../components/DateField";
import DateTimeField from "../../components/DateTimeField";

const fieldComponents = {
  [FieldType.SINGLE_LINE_TEXT](props: FieldComponentProps) {
    return <Input id={props.name} name={props.name} fluid={true} />;
  },

  [FieldType.MULTI_LINE_TEXT](props: FieldComponentProps) {
    return <Input id={props.name} name={props.name} fluid={true} />;
  },

  [FieldType.DATE](props: FieldComponentProps) {
    return <DateField {...props} className="light-border" />;
  },

  [FieldType.DATETIME](props: FieldComponentProps) {
    return <DateTimeField {...props} className="light-border" />;
  },

  [FieldType.DECIMAL](props: FieldComponentProps) {
    return <Input id={props.name} name={props.name} fluid={true} />;
  },

  [FieldType.INTEGER](props: FieldComponentProps) {
    return <Input id={props.name} name={props.name} fluid={true} />;
  }
};

const defaultFieldTypes = {
  [FieldType.SINGLE_LINE_TEXT]: "",
  [FieldType.MULTI_LINE_TEXT]: "",
  [FieldType.DATE]: new Date(),
  [FieldType.DATETIME]: new Date(),
  [FieldType.DECIMAL]: 0,
  [FieldType.INTEGER]: 0
};

export const Exp = (props: Props) => {
  const { setHeader, loading, exp } = props;
  const [formValues, setFormValues] = useState<FormObj>({} as FormObj);

  // tslint:disable-next-line:no-console
  console.log(
    `


    logging starts


    formValues`,
    formValues,
    `

    logging ends


    `
  );

  // tslint:disable-next-line:no-console
  console.log(
    `


    logging starts


    exp`,
    exp,
    `

    logging ends


    `
  );

  useEffect(
    function setRouteTitle() {
      const title = (exp && exp.title) || "Experience";

      if (setHeader) {
        setHeader(<Header title={title} sideBar={true} />);
      }

      setTitle(title);

      return setTitle;
    },
    [props.exp]
  );

  useEffect(
    function setInitialFormValues() {
      if (!exp) {
        return;
      }

      const { fieldDefs } = exp;

      if (!(fieldDefs && fieldDefs.length)) {
        return;
      }

      const initialFormValues = fieldDefs.reduce(function fieldDefReducer(
        acc,
        field,
        index
      ) {
        if (!field) {
          return acc;
        }

        acc[getFieldName(index)] = defaultFieldTypes[field.type];
        return acc;
      },
      {});

      setFormValues(initialFormValues);
    },
    [props.exp]
  );

  function setValue(formName: string, value: FormObjVal) {
    setFormValues({ ...formValues, [formName]: value });
  }

  function getFieldName(index: number) {
    return `fields[${index}]`;
  }

  if (loading) {
    return <Loading />;
  }

  if (!exp) {
    return <Loading />;
  }

  const { title, fieldDefs } = exp;

  function renderField(field: GetAnExp_exp_fieldDefs | null, index: number) {
    if (!field) {
      return null;
    }

    const { name: fieldName, type } = field;
    const name = getFieldName(index);

    return (
      <Form.Field key={index}>
        <label htmlFor={fieldName}>{fieldName}</label>

        {fieldComponents[type]({ name, setValue })}
      </Form.Field>
    );
  }

  const render = (
    <div className="app-main routes-exp">
      <div className="title">{title}</div>

      <Form>{fieldDefs.map(renderField)}</Form>
    </div>
  );

  return render;
};

export default Exp;

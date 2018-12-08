import React, { useEffect } from "react";
import { Form, Input } from "semantic-ui-react";

import "./exp.scss";
import { Props } from "./exp";
import Header from "../../components/Header";
import { setTitle } from "../../Routing";
import Loading from "../../components/Loading";
import { GetAnExp_exp_fieldDefs } from "../../graphql/apollo-gql";

export const AddExp = (props: Props) => {
  const { setHeader, loading, exp } = props;

  useEffect(
    () => {
      const title = (exp && exp.title) || "Experience";

      if (setHeader) {
        setHeader(<Header title={title} sideBar={true} />);
      }

      setTitle(title);

      return setTitle;
    },
    [props.exp]
  );

  // tslint:disable-next-line:no-console
  console.log(
    `


  logging starts


  expDef`,
    exp,
    `

  logging ends


  `
  );

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

    const { name: fieldName } = field;
    const name = `fieldDefs[${index}]`;

    return (
      <Form.Field key={index}>
        <label htmlFor={name}>{fieldName}</label>
        <Input id={name} name={name} fluid={true} />
      </Form.Field>
    );
  }

  const render = (
    <div className="app-main routes-add-exp">
      <div className="title">{title}</div>

      <Form>{fieldDefs.map(renderField)}</Form>
    </div>
  );

  return render;
};

export default AddExp;

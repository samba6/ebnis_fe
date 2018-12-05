import React, { useEffect } from "react";
import { Form } from "semantic-ui-react";

import "./add-exp.scss";
import { Props } from "./add-exp";
import Header from "../../components/Header";
import { setTitle } from "../../Routing";
import Loading from "../../components/Loading";

export const AddExp = (props: Props) => {
  const { setHeader, loading, expDef } = props;

  useEffect(() => {
    if (setHeader) {
      setHeader(<Header title="Add Exp" sideBar={true} />);

      setTitle("Add Experience");
    }

    return setTitle;
  }, []);

  if (loading) {
    return <Loading />;
  }

  if (!expDef) {
    return <Loading />;
  }

  const { title } = expDef;

  return (
    <div className="app-main routes-add-exp">
      <Form>
        <div className="title">{title}</div>
      </Form>
    </div>
  );
};

export default AddExp;

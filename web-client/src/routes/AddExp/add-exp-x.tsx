import React, { useEffect } from "react";
import { Form } from "semantic-ui-react";

import "./add-exp.scss";
import { Props } from "./add-exp";
import Header from "../../components/Header";
import { setTitle } from "../../Routing";
import Loading from "../../components/Loading";

export const AddExp = (props: Props) => {
  const { setHeader, loading, experience } = props;

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

  if (!experience) {
    return <Loading />;
  }

  const { title } = experience;

  return (
    <div className="app-main routes-add-exp">
      <Form>
        <div className="title">{title}</div>
      </Form>
    </div>
  );
};

export default AddExp;

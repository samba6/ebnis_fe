import React, { useEffect } from "react";

import "./add-exp.scss";
import { Props } from "./add-exp";
import Header from "../../components/Header";
import { setTitle } from "../../Routing";

export const AddExp = (props: Props) => {
  const { setHeader } = props;

  useEffect(() => {
    if (setHeader) {
      setHeader(<Header title="Add Exp" sideBar={true} />);

      setTitle("Add Experience");
    }

    return setTitle;
  }, []);

  return <div className="app-main routes-add-exp">Add Experience</div>;
};

export default AddExp;

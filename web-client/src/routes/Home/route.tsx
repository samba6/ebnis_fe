import React, { useEffect } from "react";

import "./home.scss";
import { Props } from "./home";
import Header from "../../components/Header";
import { setTitle, NEW_EXP } from "../../Routing";

export const Home = (props: Props) => {
  const { setHeader, history } = props;

  useEffect(() => {
    if (setHeader) {
      setHeader(<Header title="Home" sideBar={true} />);

      setTitle("Home");
    }

    return setTitle;
  }, []);

  return (
    <div className="app-main routes-home">
      Home
      <div className="new-exp-btn" onClick={() => history.push(NEW_EXP)}>
        +
      </div>
    </div>
  );
};

export default Home;

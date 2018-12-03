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

  function goToCreateNewExp() {
    history.push(NEW_EXP);
  }

  return (
    <div className="app-main routes-home">
      <button
        className="new-exp-btn"
        name="go-to-create-exp-def"
        onClick={goToCreateNewExp}
      >
        +
      </button>
    </div>
  );
};

export default Home;

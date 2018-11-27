import React from "react";
import { NavLink } from "react-router-dom";

import { Props } from "./home";
import Header from "../../components/Header";
import { setTitle, LOGIN_URL } from "../../Routing";

export class Home extends React.Component<Props> {
  componentDidMount() {
    const { setHeader } = this.props;

    if (setHeader) {
      setHeader(<Header title="Home" sideBar={true} />);
    }

    setTitle("Home");
  }

  componentWillUnmount() {
    setTitle();
  }

  render() {
    return (
      <div className="app-main">
        Home
        <NavLink to={LOGIN_URL}>This is home. Please do not click!</NavLink>
      </div>
    );
  }
}

export default Home;

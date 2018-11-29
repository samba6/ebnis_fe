import React, { useContext } from "react";
import { Icon } from "semantic-ui-react";

import "./header.scss";
import logo from "./logo.png";
import { Props } from "./header";
import { AppContext } from "../../containers/App/app";

export const Header = (props: Props) => {
  const { title, wide, sideBar } = props;
  const { onShowSidebar, showSidebar } = useContext(AppContext);
  let className = "components-header";
  className = wide ? "wide " + className : className;

  return (
    <header className={className}>
      <div className="logo-container">
        <img src={logo} className="logo" alt="logo" />
      </div>

      <div className="title">
        {title}

        <span
          className={`${sideBar ? "" : "no"} sidebar-trigger item`}
          onClick={() => onShowSidebar(!showSidebar)}
        >
          <Icon name="content" />
        </span>
      </div>
    </header>
  );
};

export default Header;
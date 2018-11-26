import React from "react";

import "./header.scss";
import logo from "./logo.png";
import { Props } from "./header";

import { Icon } from "semantic-ui-react";
export class Header extends React.Component<Props> {
  render() {
    const { title, wide, sideBar } = this.props;
    let className = "components-header";
    className = wide ? "wide " + className : className;

    return (
      <header className={className}>
        <div className="logo-container">
          <img src={logo} className="logo" alt="logo" />
        </div>

        <div className="title">
          {title}

          <a className={`${sideBar ? "" : "no"} sidebar-trigger item`}>
            <Icon name="content" />
          </a>
        </div>
      </header>
    );
  }
}

export default Header;

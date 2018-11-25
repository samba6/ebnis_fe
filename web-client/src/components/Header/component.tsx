import React from "react";

import "./header.scss";
import logo from "./logo.png";
import { Props } from "./header";

export class Header extends React.Component<Props> {
  render() {
    const { title, wide } = this.props;
    let className = "components-header";
    className = wide ? "wide " + className : className;

    return (
      <header className={className}>
        <div className="logo-container">
          <img src={logo} className="logo" alt="logo" />
        </div>

        <div className="title">{title}</div>
      </header>
    );
  }
}

export default Header;

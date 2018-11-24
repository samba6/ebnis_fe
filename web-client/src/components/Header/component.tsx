import React from "react";

import logo from "./logo.png";

export class Header extends React.Component {
  render() {
    return (
      <header className="header">
        <img src={logo} className="logo" alt="logo" />
      </header>
    );
  }
}

export default Header;

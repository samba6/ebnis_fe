import React from "react";
import { Icon } from "semantic-ui-react";

import "./header.scss";
import logo from "./logo.png";

export interface Props {
  title: string;
  wide?: boolean;
  sidebar?: boolean;
  show?: boolean;
  toggleShowSidebar?: React.Dispatch<React.SetStateAction<boolean>>;
}

export const Header = (props: Props) => {
  const { title, wide, sidebar, toggleShowSidebar, show } = props;
  let className = "components-header";
  className = wide ? "wide " + className : className;

  return (
    <header className={className}>
      <div className="logo-container">
        <img src={logo} className="logo" alt="logo" />
      </div>

      <div data-testid="app-header-title" className="title">
        {title}

        {sidebar && (
          <span
            className="sidebar-trigger item"
            onClick={() => toggleShowSidebar && toggleShowSidebar(!show)}
            data-testid="sidebar-trigger"
          >
            <Icon name="content" />
          </span>
        )}
      </div>
    </header>
  );
};

export default Header;

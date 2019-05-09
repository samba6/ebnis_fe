import React from "react";
import { Icon } from "semantic-ui-react";
import makeClassnames from "classnames";

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

  return (
    <header
      className={makeClassnames({
        "components-header": true,
        wide: !sidebar && wide
      })}
      data-testid="app-header"
    >
      <div className="logo-container">
        <img src={logo} className="logo" alt="logo" />
      </div>

      <div
        data-testid="app-header-title"
        className={makeClassnames({ title: true, "no-sidebar": !sidebar })}
      >
        <span className={sidebar ? "title_text" : ""}>{title}</span>

        {sidebar && (
          <span
            className="sidebar-trigger item"
            onClick={() => toggleShowSidebar && toggleShowSidebar(!show)}
            data-testid="sidebar-trigger"
          >
            {show ? (
              <Icon
                data-testid="close-sidebar-icon"
                className="close-sidebar-icon"
                name="close"
              />
            ) : (
              <Icon data-testid="show-sidebar-icon" name="content" />
            )}
          </span>
        )}
      </div>
    </header>
  );
};

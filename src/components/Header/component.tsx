import React from "react";
import { Icon, Menu } from "semantic-ui-react";
import makeClassnames from "classnames";
import { navigate, WindowLocation } from "@reach/router";

import "./styles.scss";
import { Props } from "./utils";
import { EXPERIENCES_URL, ROOT_URL } from "../../routes";

export const Header = (props: Props) => {
  const {
    title,
    wide,
    sidebar,
    toggleShowSidebar,
    show,
    user,
    location,
    logoAttrs: { src, height, width }
  } = props;

  const pathname = (location as WindowLocation).pathname;
  const isHome = pathname === (EXPERIENCES_URL || ROOT_URL);

  const asUrlProps = isHome
    ? {}
    : {
        onClick: () => navigate(user ? EXPERIENCES_URL : ROOT_URL)
      };

  return (
    <header
      className={makeClassnames({
        "components-header": true,
        wide: !sidebar && wide
      })}
      data-testid="app-header"
    >
      <>
        <style>
          {`#components-header-logo{ background: url(${src}) no-repeat 0 !important; background-size: ${width}px ${height}px !important; min-width: ${width}px;}`}
        </style>

        <Menu
          className={makeClassnames({
            "logo-container": true,
            "with-pointer": !isHome
          })}
          id="components-header-logo"
          {...asUrlProps}
        />
      </>

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

import React from "react";
import { Icon, Menu } from "semantic-ui-react";
import makeClassnames from "classnames";
import { WindowLocation, NavigateFn } from "@reach/router";

import "./styles.scss";
import { Props } from "./utils";
import { EXPERIENCES_URL, ROOT_URL } from "../../routes";

export const Header = (props: Props) => {
  const {
    title,
    sidebar,
    toggleShowSidebar,
    show,
    user,
    location,
    navigate,
    logoAttrs: { src, height, width }
  } = props;

  const pathname = (location as WindowLocation).pathname;
  const isHome = pathname === EXPERIENCES_URL || pathname === ROOT_URL;

  const asUrlProps = isHome
    ? {}
    : {
        onClick: () =>
          (navigate as NavigateFn)(user ? EXPERIENCES_URL : ROOT_URL)
      };

  return (
    <header className="components-header" data-testid="app-header">
      <Menu secondary={true}>
        <style>
          {`#components-header-logo{ background: url(${src}) no-repeat 0 !important; background-size: ${width}px ${height}px !important; min-width: ${width}px; min-height: ${height}px;}`}
        </style>

        <Menu.Item
          data-testid="logo-container"
          className={makeClassnames({
            "logo-container": true,
            "with-pointer": !isHome,
            "center-children": !sidebar
          })}
          {...asUrlProps}
        >
          <div id="components-header-logo" />
        </Menu.Item>

        {sidebar && (
          <Menu.Item
            position="right"
            className="sidebar-trigger"
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
          </Menu.Item>
        )}
      </Menu>

      <div
        data-testid="app-header-title"
        className={makeClassnames({
          "app-header-title": true,
          "no-sidebar": !sidebar
        })}
      >
        {title}
      </div>
    </header>
  );
};

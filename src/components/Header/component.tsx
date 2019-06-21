import React, { useContext } from "react";
import { Icon, Menu } from "semantic-ui-react";
import makeClassnames from "classnames";
import { WindowLocation, NavigateFn } from "@reach/router";
import { Link } from "gatsby";

import "./styles.scss";
import { Props } from "./utils";
import { EXPERIENCES_URL, ROOT_URL } from "../../routes";
import { LayoutContext } from "../Layout/utils";
import { SYNC_PREVIEW_URL, SYNC_URL_START } from "../../constants/sync-routes";

export const Header = (props: Props) => {
  const {
    title,
    sidebar,
    toggleShowSidebar,
    show,
    user,
    location,
    navigate,
    logoAttrs: { src, height, width },
    children,
    className = ""
  } = props;

  const pathname = (location as WindowLocation).pathname;
  const isHome = pathname === EXPERIENCES_URL || pathname === ROOT_URL;

  const { unsavedCount } = useContext(LayoutContext);

  const asUrlProps = isHome
    ? {}
    : {
        onClick: () =>
          (navigate as NavigateFn)(user ? EXPERIENCES_URL : ROOT_URL)
      };

  return (
    <header
      className={makeClassnames({
        "components-header": true,
        [className]: true
      })}
      data-testid="app-header"
    >
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

      {unsavedCount > 0 && !pathname.includes(SYNC_URL_START) && (
        <Link
          to={SYNC_PREVIEW_URL}
          data-testid="unsaved-count-label"
          className="unsaved-count-label"
        >
          {unsavedCount}
        </Link>
      )}

      {(title || children) &&
        (title ? (
          <div
            data-testid="app-header-title"
            className={makeClassnames({
              "app-header-title": true,
              "no-sidebar": !sidebar
            })}
          >
            {title}
          </div>
        ) : (
          children
        ))}
    </header>
  );
};

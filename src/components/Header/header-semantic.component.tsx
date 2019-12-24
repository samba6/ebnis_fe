import React, { useContext, PropsWithChildren } from "react";
import Menu from "semantic-ui-react/dist/commonjs/collections/Menu";
import Icon from "semantic-ui-react/dist/commonjs/elements/Icon";
import makeClassnames from "classnames";
import { Link } from "../Link";
import "./header.styles.scss";
import {
  LayoutContextHeader,
  LocationContext,
  LayoutUnchangingContext,
  LayoutActionType,
} from "../Layout/layout.utils";
import {
  UPLOAD_OFFLINE_ITEMS_PREVIEW_URL,
  UPLOAD_OFFLINE_ITEMS_URL_START,
} from "../../constants/upload-offline-items-routes";

export const HeaderSemantic = (props: Props) => {
  const { title, sidebar, children, className = "" } = props;

  const { layoutDispatch } = useContext(LayoutUnchangingContext);
  const { pathname } = useContext(LocationContext);
  const { offlineItemsCount, hasConnection, sidebarVisible } = useContext(
    LayoutContextHeader,
  );

  return (
    <header
      className={makeClassnames({
        "components-header": true,
        [className]: true,
        "header--connected": hasConnection,
        "header--disconnected": !hasConnection,
      })}
    >
      <Menu secondary={true}>
        {offlineItemsCount > 0 && !pathname.includes(UPLOAD_OFFLINE_ITEMS_URL_START) ? (
          <Link
            to={UPLOAD_OFFLINE_ITEMS_PREVIEW_URL}
            id="header-unsaved-count-label"
            className="unsaved-count-label"
          >
            {offlineItemsCount}
          </Link>
        ) : sidebar && !sidebarVisible ? (
          <Menu.Item
            position="left"
            className="sidebar-trigger"
            onClick={() => {
              layoutDispatch({
                type: LayoutActionType.TOGGLE_SIDEBAR,
              });
            }}
            id="header-sidebar-trigger"
          >
            <Icon id="header-show-sidebar-icon" name="content" />
          </Menu.Item>
        ) : null}
      </Menu>

      {(title || children) &&
        (title ? (
          <div
            id="header-app-header-title"
            className={makeClassnames({
              "app-header-title": true,
              "no-sidebar": !sidebar,
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

////////////////////////// TYPES ////////////////////////////

export interface OwnProps {
  title?: string;
  wide?: boolean;
  sidebar?: boolean;
  className?: string;
}

export type Props = PropsWithChildren<OwnProps>;

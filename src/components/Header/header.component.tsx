import React, { useContext, SetStateAction, PropsWithChildren } from "react";
import Menu from "semantic-ui-react/dist/commonjs/collections/Menu";
import Icon from "semantic-ui-react/dist/commonjs/elements/Icon";
import makeClassnames from "classnames";
import { Link } from "../Link";
import "./header.styles.scss";
import { LayoutContextHeader, LocationContext } from "../Layout/layout.utils";
import {
  UPLOAD_OFFLINE_ITEMS_PREVIEW_URL,
  UPLOAD_OFFLINE_ITEMS_URL_START,
} from "../../constants/upload-offline-items-routes";

export const Header = (props: Props) => {
  const {
    title,
    sidebar,
    toggleShowSidebar,
    show,
    children,
    className = "",
  } = props;

  const { pathname } = useContext(LocationContext);
  const { unsavedCount, hasConnection } = useContext(LayoutContextHeader);

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
        {unsavedCount > 0 && !pathname.includes(UPLOAD_OFFLINE_ITEMS_URL_START) ? (
          <Link
            to={UPLOAD_OFFLINE_ITEMS_PREVIEW_URL}
            id="header-unsaved-count-label"
            className="unsaved-count-label"
          >
            {unsavedCount}
          </Link>
        ) : sidebar ? (
          <Menu.Item
            position="left"
            className="sidebar-trigger"
            onClick={() => toggleShowSidebar && toggleShowSidebar(!show)}
            id="header-sidebar-trigger"
          >
            {show ? (
              <Icon
                id="header-close-sidebar-icon"
                className="close-sidebar-icon"
                name="close"
              />
            ) : (
              <Icon id="header-show-sidebar-icon" name="content" />
            )}
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
  show?: boolean;
  toggleShowSidebar?: React.Dispatch<SetStateAction<boolean>>;
  className?: string;
}

export type Props = PropsWithChildren<OwnProps>;

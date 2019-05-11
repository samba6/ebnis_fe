import React from "react";
import {
  RouteComponentProps,
  NavigateFn,
  WindowLocation,
  navigate
} from "@reach/router";

import "./sidebar.scss";
import { NEW_EXP_URL, ROOT_URL } from "../../routes";

interface Props extends RouteComponentProps {
  show: boolean;
  toggleShowSidebar: React.Dispatch<React.SetStateAction<boolean>>;
}

const blockClicks: React.MouseEventHandler<HTMLDivElement> = evt =>
  evt.stopPropagation();

export function Sidebar(props: Props) {
  const { location, show, toggleShowSidebar } = props;

  let visibleClass = "";
  const pathname = (location as WindowLocation).pathname;

  if (show === true) {
    visibleClass = "visible";
  }

  function hideSidebar() {
    toggleShowSidebar(false);
  }

  function onGoToExperience(where: string) {
    return function goToExperience() {
      hideSidebar();
      (navigate as NavigateFn)(where);
    };
  }

  return (
    <aside
      data-testid="app-sidebar"
      className={visibleClass + " components-sidebar"}
      onClick={hideSidebar}
    >
      <nav
        className="container"
        data-testid="sidebar-container"
        onClick={blockClicks}
      >
        <div className="sidebar-hide item" onClick={hideSidebar} />

        <ul className="sidebar__content">
          {pathname !== ROOT_URL && (
            <li onClick={onGoToExperience(ROOT_URL)}>Home</li>
          )}

          {pathname !== NEW_EXP_URL && (
            <li onClick={onGoToExperience(NEW_EXP_URL)}>New Experience</li>
          )}
        </ul>
      </nav>
    </aside>
  );
}

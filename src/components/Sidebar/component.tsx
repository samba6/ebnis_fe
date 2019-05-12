import React, { Dispatch, MouseEventHandler, SetStateAction } from "react";
import {
  RouteComponentProps,
  NavigateFn,
  WindowLocation,
  navigate
} from "@reach/router";
import makeClassNames from "classnames";

import "./styles.scss";
import { EXPERIENCE_DEFINITION_URL, EXPERIENCES_URL } from "../../routes";

interface Props extends RouteComponentProps {
  show: boolean;
  toggleShowSidebar: Dispatch<SetStateAction<boolean>>;
}

const blockClicks: MouseEventHandler<HTMLDivElement> = evt =>
  evt.stopPropagation();

export function Sidebar(props: Props) {
  const { location, show, toggleShowSidebar } = props;

  const pathname = (location as WindowLocation).pathname;

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
      className={makeClassNames({ "components-sidebar": true, visible: show })}
      onClick={hideSidebar}
    >
      <nav
        className="container"
        data-testid="sidebar-container"
        onClick={blockClicks}
      >
        <div className="sidebar-hide item" onClick={hideSidebar} />

        <ul className="sidebar__content">
          {pathname !== EXPERIENCES_URL && (
            <li onClick={onGoToExperience(EXPERIENCES_URL)}>Home</li>
          )}

          {pathname !== EXPERIENCE_DEFINITION_URL && (
            <li onClick={onGoToExperience(EXPERIENCE_DEFINITION_URL)}>
              New Experience
            </li>
          )}
        </ul>
      </nav>
    </aside>
  );
}

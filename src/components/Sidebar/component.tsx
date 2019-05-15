import React, { Dispatch, MouseEventHandler, SetStateAction } from "react";
import { RouteComponentProps, NavigateFn, WindowLocation } from "@reach/router";
import makeClassNames from "classnames";

import "./styles.scss";
import { EXPERIENCE_DEFINITION_URL, EXPERIENCES_URL } from "../../routes";

export interface Props extends RouteComponentProps {
  show: boolean;
  toggleShowSidebar: Dispatch<SetStateAction<boolean>>;
}

const blockClicks: MouseEventHandler<HTMLDivElement> = evt =>
  evt.stopPropagation();

export function Sidebar(props: Props) {
  const { location, show, toggleShowSidebar, navigate } = props;

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
        <div
          className="sidebar-hide item"
          data-testid="sidebar-hide"
          onClick={hideSidebar}
        />

        <ul className="sidebar__content">
          {pathname !== EXPERIENCES_URL && (
            <li onClick={onGoToExperience(EXPERIENCES_URL)}>My Experiences</li>
          )}

          {pathname !== EXPERIENCE_DEFINITION_URL && (
            <li onClick={onGoToExperience(EXPERIENCE_DEFINITION_URL)}>
              New Experience Definition
            </li>
          )}
        </ul>
      </nav>
    </aside>
  );
}

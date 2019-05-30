import React, { Dispatch, MouseEventHandler, SetStateAction } from "react";
import { RouteComponentProps, NavigateFn, WindowLocation } from "@reach/router";
import makeClassNames from "classnames";

import "./styles.scss";
import {
  EXPERIENCE_DEFINITION_URL,
  EXPERIENCES_URL,
  LOGIN_URL
} from "../../routes";
import { WithUser } from "../with-user-hoc";
import { UserLocalMutationProps } from "../../state/user.local.mutation";

export interface Props
  extends RouteComponentProps,
    WithUser,
    UserLocalMutationProps {
  show: boolean;
  toggleShowSidebar: Dispatch<SetStateAction<boolean>>;
}

const blockClicks: MouseEventHandler<HTMLDivElement> = evt =>
  evt.stopPropagation();

export function Sidebar(props: Props) {
  const {
    location,
    show,
    toggleShowSidebar,
    navigate,
    updateLocalUser,
    user
  } = props;

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

        <ul className="sidebar__content up">
          {pathname !== EXPERIENCES_URL && (
            <li
              className="sidebar__item"
              onClick={onGoToExperience(EXPERIENCES_URL)}
            >
              My Experiences
            </li>
          )}

          {pathname !== EXPERIENCE_DEFINITION_URL && (
            <li
              className="sidebar__item"
              onClick={onGoToExperience(EXPERIENCE_DEFINITION_URL)}
            >
              New Experience Definition
            </li>
          )}
        </ul>

        <ul className="sidebar__content down">
          {user && (
            <li
              className="sidebar__item sidebar__item--down-first-child"
              onClick={async () => {
                await updateLocalUser({
                  variables: { user: null }
                });

                (navigate as NavigateFn)(LOGIN_URL);
              }}
            >
              Log out
            </li>
          )}
        </ul>
      </nav>
    </aside>
  );
}

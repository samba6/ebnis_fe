import React, { useContext } from "react";

import "./sidebar.scss";
import { AppContext } from "../../containers/AppContext/app-context";
import { NEW_EXP_URL, ROOT_URL } from "../../Routing";
import { Props } from "./sidebar";

const blockClicks: React.MouseEventHandler<HTMLDivElement> = evt =>
  evt.stopPropagation();

export function Sidebar(props: Props) {
  const {
    history,
    location: { pathname }
  } = props;
  const { onShowSidebar, showSidebar } = useContext(AppContext);

  let visibleClass = "";

  if (showSidebar === true) {
    visibleClass = "visible";
  }

  function hideSidebar() {
    onShowSidebar(false);
  }

  function onGoToExperience(where: string) {
    return function goToExperience() {
      hideSidebar();
      history.push(where);
    };
  }

  return (
    <aside
      className={visibleClass + " components-sidebar"}
      onClick={hideSidebar}
    >
      <nav className="container" onClick={blockClicks}>
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

export default Sidebar;

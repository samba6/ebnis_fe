import React, { useContext } from "react";

import "./sidebar.scss";
import { AppContext } from "../../containers/App/app";
import { EXP_DEF, ROOT_URL } from "../../Routing";
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

  function onGoToExpDef(where: string) {
    return function goToExpDef() {
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
            <li onClick={onGoToExpDef(ROOT_URL)}>Home</li>
          )}

          {pathname !== EXP_DEF && (
            <li onClick={onGoToExpDef(EXP_DEF)}>New Experience Definition</li>
          )}
        </ul>
      </nav>
    </aside>
  );
}

export default Sidebar;

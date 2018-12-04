import React, { useContext } from "react";

import "./sidebar.scss";
import { AppContext } from "../../containers/App/app";

const blockClicks: React.MouseEventHandler<HTMLDivElement> = evt =>
  evt.stopPropagation();

export const Sidebar = () => {
  const { onShowSidebar, showSidebar } = useContext(AppContext);

  let visibleClass = "";

  if (showSidebar === true) {
    visibleClass = "visible";
  }

  return (
    <aside
      className={visibleClass + " components-sidebar"}
      onClick={() => onShowSidebar(false)}
    >
      <nav className="container" onClick={blockClicks}>
        <div
          className="sidebar-hide item"
          onClick={() => onShowSidebar(false)}
        />

        <ul className="sidebar__content">
          <li>One</li>
          <li>Two</li>
          <li>three</li>
          <li>four</li>
          <li>five</li>
          <li>One</li>
          <li>Two</li>
          <li>three</li>
          <li>four</li>
          <li>five</li>
          <li>One</li>
          <li>Two</li>
          <li>three</li>
          <li>four</li>
          <li>five</li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;

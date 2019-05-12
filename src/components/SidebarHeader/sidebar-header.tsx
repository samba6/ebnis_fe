import React, { useState, ComponentType } from "react";

import { OwnProps as HeaderProps } from "../Header/utils";
import { Sidebar } from "../Sidebar";

export interface OwnProps {
  title: string;
  sidebar?: boolean;
}

export interface Props extends OwnProps {
  Header: ComponentType<HeaderProps>;
}

export interface WithSideBar {
  SidebarHeader: ComponentType<OwnProps>;
}

export function SidebarHeader(props: Props) {
  const { title, sidebar, Header } = props;
  const [showSidebar, toggleShowSidebar] = useState(false);

  return (
    <>
      <Header
        title={title}
        show={showSidebar}
        toggleShowSidebar={toggleShowSidebar}
        sidebar={sidebar}
      />

      {sidebar && (
        <Sidebar show={showSidebar} toggleShowSidebar={toggleShowSidebar} />
      )}
    </>
  );
}

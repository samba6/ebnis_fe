import React, { useState, ComponentType, PropsWithChildren } from "react";

import { Sidebar } from "../Sidebar/sidebar-index";
import { Header } from "../Header/header-index";
import { OwnProps as HeaderOwnProps } from "../Header/header.component";

export type OwnProps = HeaderOwnProps;

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Props extends PropsWithChildren<OwnProps> {}

export interface WithSideBar {
  SidebarHeader: ComponentType<OwnProps>;
}

export const SidebarHeader = function SidebarHeaderFn(props: Props) {
  const { title, sidebar, ...restProps } = props;
  const [showSidebar, toggleShowSidebar] = useState(false);

  return (
    <>
      <Header
        title={title}
        show={showSidebar}
        toggleShowSidebar={toggleShowSidebar}
        sidebar={sidebar}
        {...restProps}
      />

      {sidebar && (
        <Sidebar show={showSidebar} toggleShowSidebar={toggleShowSidebar} />
      )}
    </>
  );
};

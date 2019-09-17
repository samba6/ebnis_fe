import React, { useState, ComponentType, PropsWithChildren } from "react";
import { Sidebar } from "../Sidebar/sidebar.component";
import { Header, OwnProps as HeaderOwnProps } from "../Header/header.component";

export type OwnProps = HeaderOwnProps;

export type Props = PropsWithChildren<OwnProps>;

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

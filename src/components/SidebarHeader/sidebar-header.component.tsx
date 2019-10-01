import React, { useState, ComponentType, PropsWithChildren } from "react";
import { Sidebar } from "../Sidebar/sidebar.component";
import { OwnProps as HeaderOwnProps } from "../Header/header.component";
import { HeaderSemantic } from "../Header/header-semantic.component";


export const SidebarHeader = function SidebarHeaderFn(props: Props) {
  const { title, sidebar, ...restProps } = props;
  const [showSidebar, toggleShowSidebar] = useState(false);

  return (
    <>
      <HeaderSemantic title={title} sidebar={sidebar} {...restProps} />

      {sidebar && (
        <Sidebar show={showSidebar} toggleShowSidebar={toggleShowSidebar} />
      )}
    </>
  );
};


export type OwnProps = HeaderOwnProps;

export type Props = PropsWithChildren<OwnProps>;

export interface WithSideBar {
  SidebarHeader: ComponentType<OwnProps>;
}

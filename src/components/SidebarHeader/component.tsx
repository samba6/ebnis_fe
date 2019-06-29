import React, { useState, ComponentType, PropsWithChildren } from "react";

import { Sidebar } from "../Sidebar";
import { Header } from "../Header";
import { OwnProps as HeaderOwnProps } from "../Header/utils";

export type OwnProps = HeaderOwnProps;

export interface Props extends PropsWithChildren<OwnProps> {}

export interface WithSideBar {
  SidebarHeader: ComponentType<OwnProps>;
}

export const SidebarHeader = React.memo(
  function SidebarHeaderFn(props: Props) {
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
  },

  // istanbul ignore next: React.memo
  function SidebarHeaderDiff(prevProps, nextProps) {
    return prevProps.title === nextProps.title;
  },
);

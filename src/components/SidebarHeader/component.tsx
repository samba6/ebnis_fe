import React, { useState, ComponentType } from "react";

import { Sidebar } from "../Sidebar";
import { Header } from "../Header";

export interface OwnProps {
  title: string;
  sidebar?: boolean;
}

// tslint:disable-next-line: no-empty-interface
export interface Props extends OwnProps {}

export interface WithSideBar {
  SidebarHeader: ComponentType<OwnProps>;
}

export const SidebarHeader = React.memo(
  function SidebarHeaderFn(props: Props) {
    const { title, sidebar } = props;
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
  },

  // istanbul ignore next: React.memo
  function SidebarHeaderDiff(prevProps, nextProps) {
    return prevProps.title === nextProps.title;
  }
);

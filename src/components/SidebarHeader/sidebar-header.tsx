import React, { useState } from "react";

import Header from "../Header";
import Sidebar from "../Sidebar";

interface Props {
  title: string;
  wide?: boolean;
  sidebar?: boolean;
}

export function SidebarHeader(props: Props) {
  const { title, sidebar, wide } = props;
  const [showSidebar, toggleShowSidebar] = useState(false);

  return (
    <>
      <Header
        title={title}
        wide={wide}
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

export default SidebarHeader;

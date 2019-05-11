import React from "react";
import { SidebarHeader as Comp, OwnProps } from "./sidebar-header";
import { Header } from "../Header";

export const SidebarHeader = function SidebarHeaderComp(props: OwnProps) {
  return <Comp {...props} Header={Header} />;
};

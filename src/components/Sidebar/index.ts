import { Sidebar as Comp } from "./sidebar-x";
import { withLocationHOC } from "../with-location";

export const Sidebar = withLocationHOC(Comp);

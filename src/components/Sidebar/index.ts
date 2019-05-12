import { Sidebar as Comp } from "./component";
import { withLocationHOC } from "../with-location";

export const Sidebar = withLocationHOC(Comp);

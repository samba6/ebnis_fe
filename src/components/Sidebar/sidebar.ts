import { compose } from "react-apollo";

import { Sidebar as Comp } from "./sidebar.component";
import { withLocationHOC } from "../with-location-hoc";

export const Sidebar = compose(withLocationHOC)(Comp);

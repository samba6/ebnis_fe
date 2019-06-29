import { compose } from "react-apollo";

import { Sidebar as Comp } from "./component";
import { withLocationHOC } from "../with-location-hoc";
import { withUserHOC } from "../with-user-hoc";
import { userLocalMutationGql } from "../../state/user.resolver";

export const Sidebar = compose(
  userLocalMutationGql,
  withLocationHOC,
  withUserHOC,
)(Comp);

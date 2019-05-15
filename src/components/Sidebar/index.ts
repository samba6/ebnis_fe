import { compose } from "react-apollo";

import { Sidebar as Comp } from "./component";
import { withLocationHOC } from "../with-location";
import { withUserHOC } from "../with-user-hoc";
import { userLocalMutationGql } from "../../state/user.local.mutation";

export const Sidebar = compose(
  userLocalMutationGql,
  withLocationHOC,
  withUserHOC
)(Comp);

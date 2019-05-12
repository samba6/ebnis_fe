import { compose } from "react-apollo";

import { Header as Comp } from "./component";
import { fetchLogoHOC } from "./fetch-logo";
import { withUserHOC } from "../with-user";
import { withLocationHOC } from "../with-location";

export const Header = compose(
  fetchLogoHOC,
  withUserHOC,
  withLocationHOC
)(Comp);

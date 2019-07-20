import { compose } from "react-apollo";

import { Header as Comp } from "./component";
import { fetchLogoHOC } from "./fetch-logo-hoc";
import { withLocationHOC } from "../with-location-hoc";

export const Header = compose(
  fetchLogoHOC,
  withLocationHOC,
)(Comp);

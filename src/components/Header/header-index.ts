import compose from "lodash/flowRight";
import { Header as Comp } from "./header.component";
import { fetchLogoHOC } from "./fetch-logo-hoc";
import { withLocationHOC } from "../with-location-hoc";

export const Header = compose(
  fetchLogoHOC,
  withLocationHOC,
)(Comp);

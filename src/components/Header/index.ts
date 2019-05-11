import { Header as Comp } from "./header-x";
import { fetchLogoHOC } from "./fetch-logo";
import { OwnProps } from "./header";

export const Header = fetchLogoHOC<OwnProps>(Comp);

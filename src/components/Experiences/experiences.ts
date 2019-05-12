import { RouteComponentProps } from "@reach/router";

import { GetExpGqlProps } from "../../graphql/exps.query";
import { WithSideBar } from "../SidebarHeader/sidebar-header";

export interface OwnProps extends RouteComponentProps<{}>, WithSideBar {}

export interface Props extends OwnProps, GetExpGqlProps {}

import { RouteProps } from "react-router-dom";

import { UserLocalGqlData } from "../../state/auth.local.query";

export interface Props extends RouteProps, UserLocalGqlData {
  component: React.ComponentClass<{}> | React.StatelessComponent<{}>;
}

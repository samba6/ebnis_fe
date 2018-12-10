import { RouteProps } from "react-router-dom";

import { UserLocalGqlData } from "../../state/auth.local.query";
import { AppContextProps } from "../../containers/AppContext/app-context";

export interface Props extends RouteProps, UserLocalGqlData, AppContextProps {
  component: React.ComponentClass<{}> | React.StatelessComponent<{}>;
  redirectTo: React.LazyExoticComponent<any>;
}

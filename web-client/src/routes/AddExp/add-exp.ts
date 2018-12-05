import { RouteComponentProps } from "react-router-dom";

import { AppRouteProps } from "../../containers/App/app";
import { GetExpDefGqlProps } from "../../graphql/get-exp.query";
import { AddExpRouteParams } from "../../Routing";

export type OwnProps = AppRouteProps & RouteComponentProps<AddExpRouteParams>;

export type Props = OwnProps & GetExpDefGqlProps;

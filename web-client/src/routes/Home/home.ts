import { RouteComponentProps } from "react-router-dom";

import { AppRouteProps } from "../../containers/App/app";
import { GetExpGqlProps } from "../../graphql/exps.query";

export type OwnProps = AppRouteProps & RouteComponentProps;

export type Props = OwnProps & GetExpGqlProps;

import { RouteComponentProps } from "react-router-dom";

import { GetExpGqlProps } from "../../graphql/exps.query";

export type OwnProps = RouteComponentProps;

export type Props = OwnProps & GetExpGqlProps;

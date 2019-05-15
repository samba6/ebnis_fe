import { RouteComponentProps } from "@reach/router";

import { GetExpGqlProps } from "../../graphql/exps.query";

export interface OwnProps extends RouteComponentProps<{}> {}

export interface Props extends OwnProps, GetExpGqlProps {}

import { RouteComponentProps } from "react-router-dom";

import { AppContextProps } from "../../containers/App/app";
import { GetExperienceGqlProps } from "../../graphql/get-exp.query";
import { AddExpRouteParams } from "../../Routing";

export type OwnProps = AppContextProps & RouteComponentProps<AddExpRouteParams>;

export type Props = OwnProps & GetExperienceGqlProps;

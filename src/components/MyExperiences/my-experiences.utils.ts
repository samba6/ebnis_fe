import { RouteComponentProps } from "@reach/router";
import { WithApolloClient } from "react-apollo";
import { GetExperienceConnectionMiniProps } from "../../graphql/get-experience-connection-mini.query";

export interface OwnProps
  extends RouteComponentProps<{}>,
    WithApolloClient<{}> {}

export interface Props extends OwnProps, GetExperienceConnectionMiniProps {}

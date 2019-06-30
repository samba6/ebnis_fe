import { RouteComponentProps } from "@reach/router";
import { WithApolloClient } from "react-apollo";
import { GetExperienceConnectionMiniProps } from "../../graphql/get-experience-connection-mini.query";
import { UnsavedExperiencesQueryProps } from "../ExperienceDefinition/resolver-utils";

export interface OwnProps
  extends RouteComponentProps<{}>,
    WithApolloClient<{}>,
    UnsavedExperiencesQueryProps {}

export interface Props extends OwnProps, GetExperienceConnectionMiniProps {}

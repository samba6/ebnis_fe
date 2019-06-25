import { RouteComponentProps } from "@reach/router";
import { NewEntryRouteParams } from "../../routes";
import { WithApolloClient } from "react-apollo";
import { UnsavedExperienceGqlProps } from "./resolvers";
import { GetExperienceFullProps } from "../../graphql/get-experience-full.query";

export interface OwnProps
  extends RouteComponentProps<NewEntryRouteParams>,
    WithApolloClient<{}> {}

export interface Props
  extends OwnProps,
    UnsavedExperienceGqlProps,
    GetExperienceFullProps {}

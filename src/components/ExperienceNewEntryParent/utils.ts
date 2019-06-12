import { RouteComponentProps } from "@reach/router";
import { NewEntryRouteParams } from "../../routes";
import { WithApolloClient } from "react-apollo";
import { UnsavedExperienceGqlProps } from "./resolvers";
import { GetExperienceGqlProps } from "../../graphql/get-exp.query";

export interface OwnProps
  extends RouteComponentProps<NewEntryRouteParams>,
    WithApolloClient<{}> {}

export interface Props
  extends OwnProps,
    UnsavedExperienceGqlProps,
    GetExperienceGqlProps {}

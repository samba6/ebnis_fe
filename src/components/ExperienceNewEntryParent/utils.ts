import { RouteComponentProps } from "@reach/router";
import { NewEntryRouteParams } from "../../routes";
import { GetExperienceFullProps } from "../../graphql/get-experience-full.query";

export type OwnProps = RouteComponentProps<NewEntryRouteParams>;

export interface Props extends OwnProps, GetExperienceFullProps {}

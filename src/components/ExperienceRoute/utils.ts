import { RouteComponentProps } from "@reach/router";
import { NewEntryRouteParams } from "../../routes";
import { ExperienceFragment } from "../../graphql/apollo-types/ExperienceFragment";

export interface Props extends RouteComponentProps<NewEntryRouteParams> {
  experience: ExperienceFragment;
}

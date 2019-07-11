import { RouteComponentProps } from "@reach/router";
import { NewEntryRouteParams } from "../../routes";
import { ExperienceFragment } from "../../graphql/apollo-types/ExperienceFragment";
import { UpdateExperienceMutationProps } from "../../graphql/update-experience.mutation";
import { UpdateEntryMutationProps } from "../../graphql/update-entry.mutation";

export interface OwnProps {
  experience: ExperienceFragment;
}

export interface Props
  extends OwnProps,
    RouteComponentProps<NewEntryRouteParams>,
    UpdateExperienceMutationProps,
    UpdateEntryMutationProps {}

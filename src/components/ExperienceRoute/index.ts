import { ExperienceRoute as Comp } from "./component";
import { graphql, compose } from "react-apollo";
import {
  UPDATE_EXPERIENCE_MUTATION,
  UpdateExperienceMutationProps,
} from "../../graphql/update-experience.mutation";
import {
  UpdateExperienceMutation,
  UpdateExperienceMutationVariables,
} from "../../graphql/apollo-types/UpdateExperienceMutation";
import { OwnProps } from "./utils";
import {
  UPDATE_ENTRY_MUTATION,
  UpdateEntryMutationProps,
} from "../../graphql/update-entry.mutation";
import {
  UpdateEntryMutation,
  UpdateEntryMutationVariables,
} from "../../graphql/apollo-types/UpdateEntryMutation";

const updateExperienceGql = graphql<
  OwnProps,
  UpdateExperienceMutation,
  UpdateExperienceMutationVariables,
  UpdateExperienceMutationProps | undefined
>(UPDATE_EXPERIENCE_MUTATION, {
  props: ({ mutate }) =>
    mutate && {
      updateExperience: mutate,
    },
});

const updateEntryGql = graphql<
  OwnProps,
  UpdateEntryMutation,
  UpdateEntryMutationVariables,
  UpdateEntryMutationProps | undefined
>(UPDATE_ENTRY_MUTATION, {
  props: ({ mutate }) =>
    mutate && {
      updateEntry: mutate,
    },
});

const ExperienceRoute = compose(
  updateExperienceGql,
  updateEntryGql,
)(Comp);

export default ExperienceRoute;

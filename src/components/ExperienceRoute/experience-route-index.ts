import { ExperienceRoute as Comp } from "./experience-route.component";
import { graphql, compose } from "react-apollo";
import {
  UPDATE_EXPERIENCE_MUTATION,
  UpdateExperienceMutationProps,
} from "../../graphql/update-experience.mutation";
import {
  UpdateExperienceMutation,
  UpdateExperienceMutationVariables,
} from "../../graphql/apollo-types/UpdateExperienceMutation";
import { OwnProps } from "./experience-route.utils";

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

const ExperienceRoute = compose(updateExperienceGql)(Comp);

export default ExperienceRoute;

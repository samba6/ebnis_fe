import { graphql } from "react-apollo";
import compose from "lodash/flowRight";
import { OwnProps } from "./experience-new-entry-parent-utils";
import { ExperienceNewEntryParent as Comp } from "./experience-new-entry-parent.component";
import {
  GET_EXPERIENCE_FULL_QUERY,
  GetExperienceFullProps,
} from "../../graphql/get-experience-full.query";
import {
  GetExperienceFullVariables,
  GetExperienceFull,
} from "../../graphql/apollo-types/GetExperienceFull";
import { isUnsavedId } from "../../constants";

const experienceGql = graphql<
  OwnProps,
  GetExperienceFull,
  GetExperienceFullVariables,
  GetExperienceFullProps | undefined
>(GET_EXPERIENCE_FULL_QUERY, {
  props: ({ data }) => data && { getExperienceGql: data },

  options: ({ experienceId }) => {
    return {
      variables: {
        id: experienceId as string,
        entriesPagination: {
          first: 20000,
        },
      },

      fetchPolicy: isUnsavedId(experienceId) ? "cache-only" : "cache-first",
    };
  },
});

const ExperienceNewEntryParent = compose(experienceGql)(Comp);

export default ExperienceNewEntryParent;

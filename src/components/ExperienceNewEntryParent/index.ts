import { graphql, compose } from "react-apollo";
import { OwnProps } from "./utils";
import { ExperienceNewEntryParent as Comp } from "./component";
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
          first: 20,
        },
      },

      fetchPolicy: isUnsavedId(experienceId) ? "cache-only" : "cache-first",
    };
  },
});

const ExperienceNewEntryParent = compose(experienceGql)(Comp);

export default ExperienceNewEntryParent;

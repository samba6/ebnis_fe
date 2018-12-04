import gql from "graphql-tag";
import { DataValue } from "react-apollo";

import { expFieldFragment } from "./exp-field.fragment";
import { experienceFragment } from "./experience.fragment";
import { GetAnExperience, GetAnExperienceVariables } from "./apollo-gql";

export const getExperience = gql`
  query GetAnExperience($experience: GetExperience!) {
    experience(experience: $experience) {
      ...ExperienceFragment
      fields {
        ...ExpFieldFragment
      }
    }
  }

  ${experienceFragment}
  ${expFieldFragment}
`;

export default getExperience;

export type GetExperienceGqlProps = DataValue<
  GetAnExperience,
  GetAnExperienceVariables
>;

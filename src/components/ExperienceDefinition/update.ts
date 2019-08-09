import { CreateExpUpdateFn } from "./utils";
import { insertExperienceInGetExperiencesMiniQuery } from "../../state/resolvers/update-get-experiences-mini-query";

// istanbul ignore next: trust apollo to act in good faith - will confirm
// during e2e test
export const ExperienceDefinitionUpdate: CreateExpUpdateFn = async (
  dataProxy,
  { data: createExperienceResponse },
) => {
  if (!createExperienceResponse) {
    return;
  }

  const experience =
    createExperienceResponse.createExperience &&
    createExperienceResponse.createExperience.experience;

  if (!experience) {
    return;
  }

  // if we have not fetched GET_EXPERIENCES_MINI_QUERY (e.g. by visiting
  // 'my experiences' page) in which case graphql field `getExperiences` would
  // have been written to apollo ROOT_QUERY, then this part of the code will
  // error because what we are trying to read does not exist on apollo
  //ROOT_QUERY
  try {
    insertExperienceInGetExperiencesMiniQuery(dataProxy, experience, {
      force: false,
    });
  } catch (error) {
    if (
      !(error.message as string).startsWith("Can't find field getExperiences")
    ) {
      throw error;
    }
  }
};

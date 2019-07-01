import { CreateExpUpdateFn } from "./utils";
import { writeGetExperienceFullQueryToCache } from "../../state/resolvers/write-get-experience-full-query-to-cache";
import { updateGetExperienceConnectionMiniQuery } from "../../state/resolvers/update-get-experience-connection-mini-query";

// istanbul ignore next: trust apollo to act in good faith - will confirm
// during e2e test
export const ExperienceDefinitionUpdate: CreateExpUpdateFn = async (
  client,
  { data: newExperience },
) => {
  if (!newExperience) {
    return;
  }

  const { createExperience: experience } = newExperience;

  if (!experience) {
    return;
  }

  writeGetExperienceFullQueryToCache(client, experience);

  // if we have not fetched GET_EXPERIENCES_MINI_QUERY (e.g. by visiting
  // 'my experiences' page) in which case graphql field `getExperiences` would
  // have been written to apollo ROOT_QUERY, then this part of the code will
  // error because what we are trying to read does not exist on apollo
  //ROOT_QUERY
  try {
    updateGetExperienceConnectionMiniQuery(client, experience, {
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

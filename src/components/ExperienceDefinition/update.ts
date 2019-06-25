import { GET_EXPERIENCES_MINI_QUERY } from "../../graphql/get-experience-connection-mini.query";
import {
  GetExperienceConnectionMini,
  GetExperienceConnectionMiniVariables
} from "../../graphql/apollo-types/GetExperienceConnectionMini";
import { CreateExpUpdateFn } from "./utils";
import immer from "immer";

// istanbul ignore next: trust apollo to act in good faith - will confirm
// during e2e test
export const ExperienceDefinitionUpdate: CreateExpUpdateFn = async (
  client,
  { data: newExperience }
) => {
  if (!newExperience) {
    return;
  }

  const { createExperience: experience } = newExperience;

  if (!experience) {
    return;
  }

  // if we have not fetched GET_EXP_DEFS_QUERY (e.g. by visiting
  // 'my experiences' page) in which case graphql field exps would have been
  // written to apollo ROOT_QUERY, then this part of the code will error because
  // what we are trying to read does not exist on apollo ROOT_QUERY
  try {
    const variables = {
      input: {
        pagination: {
          first: 20
        }
      }
    };

    const data = client.readQuery<
      GetExperienceConnectionMini,
      GetExperienceConnectionMiniVariables
    >({
      query: GET_EXPERIENCES_MINI_QUERY,
      variables
    });

    if (!data) {
      return;
    }

    const { exps } = data;

    if (!exps) {
      return;
    }

    const updatedExperienceConnection = immer(exps, proxy => {
      const edges = proxy.edges || [];

      edges.push({
        node: experience,
        cursor: "",
        __typename: "ExperienceEdge"
      });

      proxy.edges = edges;
    });

    await client.writeQuery({
      query: GET_EXPERIENCES_MINI_QUERY,
      variables,
      data: { exps: updatedExperienceConnection }
    });
  } catch (error) {
    if (!(error.message as string).startsWith("Can't find field exps")) {
      throw error;
    }
  }
};

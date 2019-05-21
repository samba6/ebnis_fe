import { GET_EXP_DEFS_QUERY } from "../../graphql/exps.query";
import { GetExps } from "../../graphql/apollo-types/GetExps";
import { CreateExpUpdateFn } from "./utils";

// istanbul ignore next: trust apollo to act in good faith - will confirm
// during e2e test
export const ExperienceDefinitionUpdate: CreateExpUpdateFn = async (
  client,
  { data: newExperience }
) => {
  if (!newExperience) {
    return;
  }

  const { exp } = newExperience;

  if (!exp) {
    return;
  }

  // if we have not fetched GET_EXP_DEFS_QUERY (e.g. by visiting
  // 'my experiences' page) in which case graphql field exps would have been
  // written to apollo ROOT_QUERY, then this part of the code will error because
  // what we are trying to read does not exist on apollo ROOT_QUERY
  try {
    const data = client.readQuery<GetExps>({
      query: GET_EXP_DEFS_QUERY
    });

    if (!data) {
      return;
    }

    const { exps } = data;

    if (!exps) {
      return;
    }

    await client.writeQuery({
      query: GET_EXP_DEFS_QUERY,
      data: { exps: [...exps, exp] }
    });
  } catch (error) {
    if (
      !(error.message as string).startsWith("Can't find field exps on object")
    ) {
      throw error;
    }
  }
};

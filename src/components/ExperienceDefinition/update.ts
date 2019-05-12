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
};

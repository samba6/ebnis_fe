import { LocalResolverFn } from "../../state/resolvers";
import { GetExps_exps, GetExps } from "../../graphql/apollo-types/GetExps";
import { GET_EXP_DEFS_QUERY } from "../../graphql/exps.query";

const experiencesOfflineResolver: LocalResolverFn<{}, GetExps_exps[]> = (
  root,
  variables,
  { cache }
) => {
  try {
    const data = cache.readQuery<GetExps>({
      query: GET_EXP_DEFS_QUERY
    });

    if (!data) {
      return [];
    }

    return data.exps as GetExps_exps[];
  } catch (error) {
    if (
      !(error.message as string).startsWith("Can't find field exps on object")
    ) {
      throw error;
    }

    return [];
  }
};

export const resolvers = {
  Query: {
    experiencesOffline: experiencesOfflineResolver
  }
};

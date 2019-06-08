import { LocalResolverFn } from "../../state/resolvers";
import {
  GetExps_exps,
  GetExps,
  GetExpsVariables
} from "../../graphql/apollo-types/GetExps";
import { GET_EXP_DEFS_QUERY } from "../../graphql/exps.query";

const EMPTY_EXPERIENCE_CONNECTION: GetExps_exps = {
  edges: [],
  __typename: "ExperienceConnection",
  pageInfo: {
    hasNextPage: false,
    hasPreviousPage: false,
    __typename: "PageInfo"
  }
};

const experiencesOfflineResolver: LocalResolverFn<
  GetExpsVariables,
  GetExps_exps
> = (root, variables, { cache }) => {
  try {
    const data = cache.readQuery<GetExps, GetExpsVariables>({
      query: GET_EXP_DEFS_QUERY,
      variables
    });

    if (!data) {
      return EMPTY_EXPERIENCE_CONNECTION;
    }

    return data.exps as GetExps_exps;
  } catch (error) {
    if (!(error.message as string).includes("Can't find field exps")) {
      throw error;
    }

    return EMPTY_EXPERIENCE_CONNECTION;
  }
};

export const resolvers = {
  Query: {
    experiencesOffline: experiencesOfflineResolver
  }
};

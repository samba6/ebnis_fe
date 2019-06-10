import { LocalResolverFn } from "../../state/resolvers";
import {
  GetExps_exps,
  GetExps,
  GetExpsVariables
} from "../../graphql/apollo-types/GetExps";
import { GET_EXP_DEFS_QUERY } from "../../graphql/exps.query";
import { EXPERIENCE_CONNECTION_FRAGMENT } from "../../graphql/experience-connection.fragment";
import gql from "graphql-tag";
import { graphql } from "react-apollo";
import {
  UNSAVED_EXPERIENCES_QUERY,
  UnsavedExperiencesQueryValues
} from "../ExperienceDefinition/resolver-utils";

///////////// OFFLINE EXPERIENCE /////////////////////////////

const EMPTY_EXPERIENCE_CONNECTION: GetExps_exps = {
  edges: [],
  __typename: "ExperienceConnection",
  pageInfo: {
    hasNextPage: false,
    hasPreviousPage: false,
    __typename: "PageInfo"
  }
};

const serverOfflineExperiencesResolver: LocalResolverFn<
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

export const SERVER_OFFLINE_EXPERIENCES_QUERY = gql`
  query ExperiencesOfflineQuery($pagination: PaginationInput!) {
    serverOfflineExperiences(pagination: $pagination) @client {
      ...ExperienceConnectionFragment
    }
  }

  ${EXPERIENCE_CONNECTION_FRAGMENT}
`;

//////////////////////// END OFFLINE EXPERIENCE /////////////////////////////

////////////////////// UNSAVED EXPERIENCES //////////////////////////////////

// the `unsavedExperiences` is on the root resolver and that's why we don't
// need a resolver here.

export const unsavedExperiencesGql = graphql<
  {},
  UnsavedExperiencesQueryValues,
  {},
  UnsavedExperiencesQueryValues | undefined
>(UNSAVED_EXPERIENCES_QUERY, {
  props: ({ data }) =>
    data && {
      unsavedExperiences: data.unsavedExperiences || []
    }
});
///////////////////// END UNSAVED EXPERIENCES ///////////////////////////////

export const resolvers = {
  Query: {
    serverOfflineExperiences: serverOfflineExperiencesResolver
  }
};

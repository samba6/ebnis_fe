import { graphql,  } from "react-apollo";

import {
  GET_EXP_QUERY,
  GetExperienceGqlProps
} from "../../graphql/get-exp.query";
import {
  GetAnExp,
  GetAnExpVariables
} from "../../graphql/apollo-types/GetAnExp";
import ApolloClient, { Resolvers } from 'apollo-client';
import { isUnsavedId } from '../../constants';

export function getExperienceGql<T extends {experienceId?: string, client: ApolloClient<{}>}>(resolvers: Resolvers, resolverAdded: boolean) {

  return graphql<
  T,
  GetAnExp,
  GetAnExpVariables,
  GetExperienceGqlProps | undefined
>(GET_EXP_QUERY, {
  props: ({ data }) => data && { getExperienceGql: data },

  options: ({ experienceId }) => {
    return {
      variables: {
        exp: {
          id: experienceId as string
        },

        pagination: {
          first: 20
        }
      }
    };
  },

  skip: ({ experienceId, client }) => {
    if (!resolverAdded) {
      client.addResolvers(resolvers);

      resolverAdded = true;
    }

    return isUnsavedId(experienceId);
  }
});
  
}
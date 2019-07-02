import { CacheResolver } from "apollo-cache-inmemory";

const getExperience: CacheResolver = (_, args, { getCacheKey }) =>
  getCacheKey({
    __typename: "Experience",
    id: args.id,
  });

export const CUSTOM_QUERY_RESOLVERS = {
  Query: {
    getExperience,
  },
};

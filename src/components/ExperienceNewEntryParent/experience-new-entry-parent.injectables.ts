import {
  GetExperienceFullVariables,
  GetExperienceFull,
} from "../../graphql/apollo-types/GetExperienceFull";
import { isOfflineId } from "../../constants";
import { useQuery } from "@apollo/react-hooks";
import { GET_EXPERIENCE_FULL_QUERY } from "../../graphql/get-experience-full.query";

export function useGetExperienceFullQuery(experienceId?: string) {
  return useQuery<GetExperienceFull, GetExperienceFullVariables>(
    GET_EXPERIENCE_FULL_QUERY,
    {
      variables: {
        id: experienceId as string,
        entriesPagination: {
          first: 20000,
        },
      },
      fetchPolicy: isOfflineId(experienceId) ? "cache-only" : "cache-first",
    },
  );
}

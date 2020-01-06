import {
  GetExperienceFullVariables,
  GetExperienceFull,
} from "../../graphql/apollo-types/GetExperienceFull";
import { isOfflineId } from "../../constants";
import { useQuery } from "@apollo/react-hooks";
import {
  GET_EXPERIENCE_FULL_QUERY,
  entriesPaginationVariables,
} from "../../graphql/get-experience-full.query";

export function useGetExperienceFullQuery(experienceId?: string) {
  return useQuery<GetExperienceFull, GetExperienceFullVariables>(
    GET_EXPERIENCE_FULL_QUERY,
    {
      variables: {
        id: experienceId as string,
        ...entriesPaginationVariables,
      },
      fetchPolicy: isOfflineId(experienceId) ? "cache-only" : "cache-first",
    },
  );
}

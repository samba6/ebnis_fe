import React, { useEffect } from "react";
import { Loading } from "../Loading/loading";
import { NEW_ENTRY_URL } from "../../constants/new-entry-route";
import { NavigateFn } from "@reach/router";
import { NewEntry, ExperienceRoute } from "./loadables";
import { GET_EXPERIENCE_FULL_QUERY } from "../../graphql/get-experience-full.query";
import {
  GetExperienceFullVariables,
  GetExperienceFull,
} from "../../graphql/apollo-types/GetExperienceFull";
import { isUnsavedId } from "../../constants";
import { useQuery } from "@apollo/react-hooks";
import { RouteComponentProps } from "@reach/router";
import { NewEntryRouteParams } from "../../routes";

export const ExperienceNewEntryParent = function(props: Props) {
  const { experienceId, path, navigate } = props;

  const { loading, error: getExperienceGqlError, data } = useQuery<
    GetExperienceFull,
    GetExperienceFullVariables
  >(GET_EXPERIENCE_FULL_QUERY, {
    variables: {
      id: experienceId as string,
      entriesPagination: {
        first: 20000,
      },
    },
    // istanbul ignore next:
    fetchPolicy: isUnsavedId(experienceId) ? "cache-only" : "cache-first",
  });

  const getExperience = data && data.getExperience;

  useEffect(() => {
    if (getExperienceGqlError || (!loading && !getExperience)) {
      (navigate as NavigateFn)("/404");
    }
  }, [getExperienceGqlError, loading, getExperience, navigate]);

  if (loading) {
    return <Loading loading={loading} />;
  }

  return path === NEW_ENTRY_URL ? (
    <NewEntry {...props} experience={getExperience} />
  ) : (
    <ExperienceRoute {...props} experience={getExperience} />
  );
};

export default ExperienceNewEntryParent;

export type Props = RouteComponentProps<NewEntryRouteParams>;

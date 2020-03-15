import React, { useEffect } from "react";
import { Loading } from "../Loading/loading";
import { NEW_ENTRY_URL } from "../../constants/new-entry-route";
import { NavigateFn } from "@reach/router";
import {
  NewEntry,
  ExperienceRoute,
} from "./experience-new-entry-parent.loadables";
import { RouteComponentProps } from "@reach/router";
import { NewEntryRouteParams } from "../../routes";
import { useGetExperienceFullQuery } from "./experience-new-entry-parent.injectables";

export const ExperienceNewEntryParent = function(props: Props) {
  const { experienceId, path, navigate } = props;

  const {
    loading,
    error: getExperienceGqlError,
    data,
  } = useGetExperienceFullQuery(experienceId);

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

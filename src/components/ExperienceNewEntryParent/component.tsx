import React, { useEffect } from "react";
import { Props } from "./utils";
import { Loading } from "../Loading";
import { NEW_ENTRY_URL } from "../../constants/new-entry-route";
import { GetExperienceFullData } from "../../graphql/get-experience-full.query";
import { NavigateFn } from "@reach/router";
import { NewEntry, ExperienceRoute } from "./loadables";

export const ExperienceNewEntryParent = function(props: Props) {
  const {
    getExperienceGql: {
      loading,
      error: getExperienceGqlError,
      getExperience,
    } = {} as GetExperienceFullData,

    path,
    navigate,
  } = props;

  useEffect(() => {
    if (getExperienceGqlError || (!loading && !getExperience)) {
      (navigate as NavigateFn)("/404");
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getExperienceGqlError, loading, getExperience]);

  if (loading) {
    return <Loading loading={loading} />;
  }

  return path === NEW_ENTRY_URL ? (
    <NewEntry {...props} experience={getExperience} />
  ) : (
    <ExperienceRoute {...props} experience={getExperience} />
  );
};

import React, { useEffect, useRef } from "react";
import { Props } from "./utils";
import { Loading } from "../Loading";
import { NEW_ENTRY_URL } from "../../constants/new-entry-route";
import { GetExperienceFullData } from "../../graphql/get-experience-full.query";
import { NavigateFn } from "@reach/router";
import { NewEntry, ExperienceRoute } from "./loadables";
import { isUnsavedId } from "../../constants";

export const ExperienceNewEntryParent = function(props: Props) {
  const {
    getExperienceGql: {
      loading,
      error: getExperienceGqlError,
      getExperience,
    } = {} as GetExperienceFullData,

    path,
    navigate,
    experienceId,
  } = props;

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const timeout = timeoutRef.current;

    if (isUnsavedId(experienceId)) {
      if (!getExperience && timeout === null) {
        timeoutRef.current = setTimeout(() => {
          (navigate as NavigateFn)("/404");
        }, 100);
      }
    }

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [experienceId, getExperience]);

  useEffect(() => {
    if (getExperienceGqlError || (!loading && !getExperience)) {
      (navigate as NavigateFn)("/404");
    }

    const timeout = timeoutRef.current;

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };

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

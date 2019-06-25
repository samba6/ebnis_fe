import React, { useEffect } from "react";
import { Props } from "./utils";
import { Loading } from "../Loading";
import { NEW_ENTRY_URL } from "../../constants/new-entry-route";
import { GetExperienceFullData } from "../../graphql/get-experience-full.query";
import { UnsavedExperienceDataValue } from "./resolvers";
import { NavigateFn } from "@reach/router";
import { NewEntry, Experience } from "./loadables";

export const ExperienceNewEntryParent = function(props: Props) {
  const {
    getExperienceGql: {
      loading: loadingExperience,
      error: getExperienceGqlError,
      exp
    } = {} as GetExperienceFullData,

    unsavedExperienceGql: {
      loading: loadingUnsavedExperience,
      error: unsavedExperienceGqlError,
      unsavedExperience
    } = {} as UnsavedExperienceDataValue,

    path,
    navigate
  } = props;

  const experience = exp || unsavedExperience;

  const loading = loadingExperience || loadingUnsavedExperience;

  useEffect(() => {
    if (
      getExperienceGqlError ||
      unsavedExperienceGqlError ||
      (!loading && !experience)
    ) {
      (navigate as NavigateFn)("/404");
    }
  }, [getExperienceGqlError, unsavedExperienceGqlError, loading, experience]);

  if (loading) {
    return <Loading loading={loading} />;
  }

  return path === NEW_ENTRY_URL ? (
    <NewEntry {...props} experience={experience} />
  ) : (
    <Experience {...props} experience={experience} />
  );
};

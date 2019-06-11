import { useState, useEffect, useRef } from "react";
import { GetExperienceGqlValues } from "../../graphql/get-exp.query";
import {
  UnsavedExperienceDataValue,
  UnsavedExperienceReturnedValue,
  UnsavedExperienceVariables
} from "./resolvers";
import { UnsavedExperience } from "../ExperienceDefinition/resolver-utils";
import { GetAnExp_exp } from "../../graphql/apollo-types/GetAnExp";
import { GET_UNSAVED_EXPERIENCE_QUERY } from "./get-unsaved-experience-gql";
import ApolloClient from "apollo-client";

interface Args {
  client: ApolloClient<{}>;
  experienceId?: string;
  getExperienceGql?: GetExperienceGqlValues;
  unsavedExperienceGql?: UnsavedExperienceDataValue;
}

export function useManualUnsavedExperience<T extends Args>({
  experienceId,
  getExperienceGql = {} as GetExperienceGqlValues,
  unsavedExperienceGql = {} as UnsavedExperienceDataValue,
  client
}: T) {
  const { exp } = getExperienceGql;

  const {
    unsavedExperience,
    loading: loadingUnsavedExperience
  } = unsavedExperienceGql;

  const [unsavedExperienceFromState, setUnsavedExperienceFromState] = useState<
    UnsavedExperience | undefined
  >();

  const [
    loadingUnsavedExperienceForState,
    setLoadingUnsavedExperienceForState
  ] = useState<boolean>(false);

  const experienceToRender = (exp ||
    unsavedExperience ||
    unsavedExperienceFromState) as GetAnExp_exp;

  const loadingUnsavedExperienceTimeoutRef = useRef<number | null>(null);

  /**
   * When server is offline and
   * user visits this page directly from browser address bar rather
   * than by navigating from another link, it is possible that the cache
   * will not have been ready so that the `unsavedExperience` query will
   * return undefined even when the unsaved experience is in the cache. So we
   * wait for some time and manually fetch the unsaved experience.
   */
  useEffect(() => {
    const { current: timeout } = loadingUnsavedExperienceTimeoutRef;

    if (
      timeout === null &&
      loadingUnsavedExperience === false &&
      !loadingUnsavedExperienceForState &&
      !unsavedExperience &&
      !unsavedExperienceFromState
    ) {
      setLoadingUnsavedExperienceForState(true);

      loadingUnsavedExperienceTimeoutRef.current = (setTimeout(async () => {
        const result = await client.query<
          UnsavedExperienceReturnedValue,
          UnsavedExperienceVariables
        >({
          query: GET_UNSAVED_EXPERIENCE_QUERY,
          variables: {
            id: experienceId as string
          }
        });

        setUnsavedExperienceFromState(
          result && result.data && result.data.unsavedExperience
        );

        setLoadingUnsavedExperienceForState(false);
      }, 200) as unknown) as number;
    } else if (
      timeout !== null &&
      (unsavedExperienceFromState || unsavedExperience)
    ) {
      clearTimeout(timeout);
      loadingUnsavedExperienceTimeoutRef.current = null;
    }

    return () => {
      if (timeout !== null) {
        clearTimeout(timeout);
      }
    };
  }, [
    loadingUnsavedExperience,
    unsavedExperience,
    loadingUnsavedExperienceForState,
    unsavedExperienceFromState
  ]);

  return {
    experienceToRender,
    loadingUnsavedExperienceForState
  };
}

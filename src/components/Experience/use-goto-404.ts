import { useEffect } from "react";
import { Props } from "./utils";
import { GetExperienceGqlValues } from "../../graphql/get-exp.query";
import { NavigateFn } from "@reach/router";
import { GetAnExp_exp } from "../../graphql/apollo-types/GetAnExp";

export function useGoto404OnExperienceNotFound<
  T extends Pick<Props, "navigate" | "getExperienceGql">
>(
  { getExperienceGql: { error } = {} as GetExperienceGqlValues, navigate }: T,
  loading: boolean,
  experienceToRender: GetAnExp_exp
) {
  useEffect(() => {
    if (error || (!loading && !experienceToRender)) {
      (navigate as NavigateFn)("/404");
    }
  }, [error, loading, experienceToRender]);
}

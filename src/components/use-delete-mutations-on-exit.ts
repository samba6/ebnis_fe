import { useContext, useEffect } from "react";
import { LayoutContext } from "./Layout/utils";
import { removeQueriesAndMutationsFromCache } from "../state/resolvers/delete-references-from-cache";

export function useDeleteMutationsOnExit(
  mutations: string[],
  shouldDelete?: boolean,
) {
  const { cache } = useContext(LayoutContext);

  useEffect(() => {
    if (!shouldDelete) {
      return;
    }

    return () => {
      removeQueriesAndMutationsFromCache(cache, mutations);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldDelete]);
}

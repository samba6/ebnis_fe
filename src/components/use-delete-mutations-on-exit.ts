import { useContext, useEffect } from "react";
import { removeQueriesAndMutationsFromCache } from "../state/resolvers/delete-references-from-cache";
import { EbnisAppContext } from "../context";

export function useDeleteMutationsOnExit(
  mutations: string[],
  shouldDelete?: boolean,
) {
  const { cache } = useContext(EbnisAppContext);

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

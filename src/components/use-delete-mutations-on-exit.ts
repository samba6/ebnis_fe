import { useContext, useEffect } from "react";
import { removeQueriesAndMutationsFromCache } from "../state/resolvers/delete-references-from-cache";
import { EbnisAppContext } from "../context";

export function useDeleteCachedQueriesMutationsOnExit(
  mutations: string[],
  shouldDelete?: boolean,
) {
  const { cache, persistor } = useContext(EbnisAppContext);

  useEffect(() => {
    if (!shouldDelete) {
      return;
    }

    return () => {
      removeQueriesAndMutationsFromCache(cache, mutations);
      persistor.persist();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldDelete]);
}

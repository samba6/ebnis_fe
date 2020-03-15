/* istanbul ignore file */
import { useContext, useEffect } from "react";
import { EbnisAppContext } from "../context";
import { cleanupRanQueriesFromCache } from "../apollo-cache/cleanup-ran-queries-from-cache";

export function useDeleteCachedQueriesAndMutationsOnUnmount(
  mutations: string[],
  shouldDelete?: boolean,
) {
  const { cache, persistor } = useContext(EbnisAppContext);

  useEffect(() => {
    if (!shouldDelete) {
      return;
    }

    return () => {
      cleanupRanQueriesFromCache(cache, mutations, persistor);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldDelete]);
}

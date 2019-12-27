import { useContext, useEffect } from "react";
import { EbnisAppContext } from "../context";
import { deleteCachedQueriesAndMutationsCleanupFn } from "./delete-cached-queries-and-mutations-cleanup";

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
      deleteCachedQueriesAndMutationsCleanupFn(cache, mutations, persistor);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldDelete]);
}

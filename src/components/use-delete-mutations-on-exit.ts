import { useContext, useEffect } from "react";
import { LayoutContext } from "./Layout/utils";
import { removeMutationsFromCache } from "../state/resolvers/delete-ids-from-cache";

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
      removeMutationsFromCache(cache, mutations);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldDelete]);
}

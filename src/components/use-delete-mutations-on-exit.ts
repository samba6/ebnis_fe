import { useContext, useEffect } from "react";
import { LayoutContext } from "./Layout/utils";
import { removeMutationsFromCache } from "../state/resolvers/delete-ids-from-cache";

export function useDeleteMutationsOnExit(mutations: string[]) {
  const { cache } = useContext(LayoutContext);

  useEffect(() => {
    return () => {
      removeMutationsFromCache(cache, mutations);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

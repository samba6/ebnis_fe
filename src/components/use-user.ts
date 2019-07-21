import { useMemo } from "react";
import { getUser } from "../state/users";

export function useUser() {
  return useMemo(() => {
    return getUser();
  }, []);
}

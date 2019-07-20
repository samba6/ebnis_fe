import { useEffect, useState } from "react";
import { navigate } from "@reach/router";

import { EXPERIENCES_URL } from "../routes";
import { getUser } from "../state/users";

export function useIsLoggedIn() {
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  useEffect(function isLoggedInFn() {
    if (getUser()) {
      navigate(EXPERIENCES_URL);
      return;
    }

    setIsLoggedIn(false);
  }, []);

  return isLoggedIn;
}

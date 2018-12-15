import { ROOT_URL } from ".";
import { SCHEMA_KEY } from "../constants";

export default function refreshToHome() {
  function getUser() {
    const data = localStorage.getItem(SCHEMA_KEY);

    if (!data) {
      return null;
    }

    try {
      const { ROOT_QUERY } = JSON.parse(data);

      if (!ROOT_QUERY) {
        return null;
      }

      return ROOT_QUERY.user;
    } catch {
      return null;
    }
  }

  if (getUser()) {
    window.location.href = ROOT_URL;
    return;
  }

  let intervalId: NodeJS.Timeout;
  let counter = 0;

  intervalId = setInterval(() => {
    if (getUser() || counter === 500) {
      clearInterval(intervalId);
      window.location.href = ROOT_URL;
    }

    counter++;
  }, 10);
}

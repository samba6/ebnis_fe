import { SCHEMA_KEY } from "../../constants";
import { ROOT_URL } from "../../Routing";

export default function refreshToHome() {
  let intervalId: NodeJS.Timeout;
  let counter = 0;

  intervalId = setInterval(() => {
    if (localStorage.getItem(SCHEMA_KEY) || counter === 500) {
      clearInterval(intervalId);
      window.location.href = ROOT_URL;
    }

    counter++;
  }, 10);
}

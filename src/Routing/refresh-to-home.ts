import { ROOT_URL } from ".";

export default function refreshToHome() {
  let intervalId: NodeJS.Timeout;

  intervalId = setTimeout(() => {
    clearInterval(intervalId);
    window.location.href = ROOT_URL;
  }, 3000);
}

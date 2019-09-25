import { EXPERIENCES_URL } from "./routes";

export async function refreshToHome() {
  await window.____ebnis.persistor.persist();

  window.location.href = EXPERIENCES_URL;
  // window.location.replace(EXPERIENCES_URL);
}

import { EXPERIENCES_URL } from "./routes";
import { CachePersistor } from "apollo-cache-persist";

export async function refreshToHome(persistor: null | CachePersistor<{}>) {
  if (persistor) {
    await persistor.persist();
  }

  window.location.href = EXPERIENCES_URL;
}

import { CLIENT_ONLY_PATH_PREFIX } from "./client-only-prefix";

export const NEW_ENTRY_URL =
  CLIENT_ONLY_PATH_PREFIX + "/experience/:experienceId/entry";

export function makeNewEntryRoute(experienceId: string) {
  return NEW_ENTRY_URL.replace(":experienceId", experienceId);
}

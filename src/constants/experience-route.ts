import { CLIENT_ONLY_PATH_PREFIX } from "./client-only-prefix";

export const EXPERIENCE_URL =
  CLIENT_ONLY_PATH_PREFIX + "/experience/:experienceId";

export function makeExperienceRoute(experienceId: string) {
  return EXPERIENCE_URL.replace(":experienceId", experienceId);
}

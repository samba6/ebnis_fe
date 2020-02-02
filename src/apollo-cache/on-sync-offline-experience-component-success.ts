import { EbnisContextProps } from "../context";
import { makeExperienceRoute } from "../constants/experience-route";
import { replaceExperiencesInGetExperiencesMiniQuery } from "./update-get-experiences-mini-query";
import { wipeReferencesFromCache } from "../state/resolvers/delete-references-from-cache";

const KEY = "b/hukZDBJw5I2rH89I3";

export function saveOnSyncOfflineExperienceComponentSuccess(ids: string[]) {
  window.localStorage.setItem(KEY, JSON.stringify(ids));
  const syncedId = ids[ids.length - 1];

  window.location.replace(makeExperienceRoute(syncedId));
}

export function execOnSyncOfflineExperienceComponentSuccess<Action>(
  pathname: string,
  onMatchUrl: () => void,
  cacheThings: EbnisContextProps,
) {
  const ids = window.localStorage.getItem(KEY);

  if (!ids) {
    return;
  }

  window.localStorage.removeItem(KEY);
  const { client, cache, persistor } = cacheThings;

  const allIds = JSON.parse(ids) as string[];
  const lenLess1 = allIds.length - 1;

  const unsyncedIds = allIds.slice(0, lenLess1);

  replaceExperiencesInGetExperiencesMiniQuery(client, {
    [unsyncedIds[0]]: null,
  });

  wipeReferencesFromCache(cache, unsyncedIds);
  persistor.persist();

  const url = makeExperienceRoute(allIds[lenLess1]);
  if (url === pathname) {
    onMatchUrl();
  }
}

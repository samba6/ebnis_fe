import { getUnsyncedExperience } from "../../apollo-cache/unsynced.resolvers";
import { isOfflineId } from "../../constants";
import { EntryFragment } from "../../graphql/apollo-types/EntryFragment";

export function getOnlineStatus(entry: EntryFragment) {
  const { id: entryId, experienceId } = entry;

  let isOnline = true;
  let isPartOffline = false;
  const isOffline = isOfflineId(entryId);

  if (isOffline) {
    isOnline = false;
  } else {
    const unsyncedExperience = getUnsyncedExperience(experienceId);

    if (unsyncedExperience) {
      const unsyncedModifiedEntries = unsyncedExperience.modifiedEntries;

      if (unsyncedModifiedEntries && unsyncedModifiedEntries[entryId]) {
        isOnline = false;
        isPartOffline = true;
      }
    }
  }

  return {
    isOffline,
    isOnline,
    isPartOffline,
  };
}

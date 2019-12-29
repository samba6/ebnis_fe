import { getExperiencesFromCache } from "../state/resolvers/get-experiences-from-cache";
import { ApolloClient } from "apollo-client";
import immer from "immer";
import { writeOfflineItemsToCache } from "./write-offline-items-to-cache";

export interface DecrementOfflineEntriesCountForExperienceArgs {
  client: ApolloClient<{}>;
  experienceId: string;
  howMany: number;
}

export async function decrementOfflineEntriesCountForExperience({
  client,
  experienceId,
  howMany,
}: DecrementOfflineEntriesCountForExperienceArgs) {
  let cacheData = await getExperiencesFromCache(client);

  if (cacheData.length === 0) {
    return;
  }

  let updated = false;

  cacheData = immer(cacheData, proxy => {
    let index = 0;
    let len = proxy.length;

    for (; index < len; index++) {
      const experience = proxy[index];
      let { id, offlineEntriesCount } = experience;

      if (id === experienceId) {
        updated = true;
        offlineEntriesCount -= howMany;

        if (offlineEntriesCount > 0) {
          experience.offlineEntriesCount = offlineEntriesCount;
          proxy[index] = experience;
        } else {
          proxy.splice(index, 1);
        }

        break;
      }
    }
  });

  if (updated) {
    writeOfflineItemsToCache(client, cacheData);
  }
}

import { FetchResult } from "react-apollo";
import immer from "immer";

import {
  UploadAllUnsavedsMutation,
  UploadAllUnsavedsMutation_saveOfflineExperiences,
} from "../../graphql/apollo-types/UploadAllUnsavedsMutation";
import { ExperiencesIdsToObjectMap } from "./utils";
import { DataProxy } from "apollo-cache";
import {
  CreateEntriesResponseFragment,
  CreateEntriesResponseFragment_entries,
} from "../../graphql/apollo-types/CreateEntriesResponseFragment";
import {
  ExperienceFragment,
  ExperienceFragment_entries_edges_node,
  ExperienceFragment_entries,
  ExperienceFragment_entries_edges,
} from "../../graphql/apollo-types/ExperienceFragment";
import {
  writeSavedExperiencesWithUnsavedEntriesToCache,
  writeUnsavedExperiencesToCache,
  removeAllReferencesToEntityFromCache,
  updateGetExperiencesQuery,
  RemoveReferencesToEntityFromCache,
} from "../../state/resolvers-utils";
import { UnsavedExperience } from "../ExperienceDefinition/resolver-utils";
import { entryNodesFromExperience } from "../../state/unsaved-resolvers";
import { writeGetExperienceFullQueryToCache } from "../../state/resolvers/write-get-experience-full-query-to-cache";

type OnUploadSuccessUpdate = (args: {
  savedExperiencesIdsToUnsavedEntriesMap: ExperiencesIdsToObjectMap;
  unsavedExperiences: UnsavedExperience[];
}) => (
  proxy: DataProxy,
  mutationResult: FetchResult<UploadAllUnsavedsMutation>,
) => {
  updatedSavedExperiences?: ExperienceFragment[];
  didUnsavedExperiencesUpdate?: boolean;
};

export const onUploadSuccessUpdate: OnUploadSuccessUpdate = ({
  savedExperiencesIdsToUnsavedEntriesMap,
  unsavedExperiences,
}) => (dataProxy, { data: uploadResult }) => {
  if (!uploadResult) {
    return {};
  }

  const { createEntries, saveOfflineExperiences } = uploadResult;

  const updatedSavedExperiences = updateSavedExperiences(
    dataProxy,
    createEntries,
    savedExperiencesIdsToUnsavedEntriesMap,
  );

  const didUnsavedExperiencesUpdate = updateUnsavedExperiences(
    dataProxy,
    saveOfflineExperiences,
    unsavedExperiences,
  );

  return {
    updatedSavedExperiences,
    didUnsavedExperiencesUpdate,
  };
};

function updateUnsavedExperiences(
  dataProxy: DataProxy,
  saveOfflineExperiencesResult:
    | (UploadAllUnsavedsMutation_saveOfflineExperiences | null)[]
    | null,
  unsavedExperiences: UnsavedExperience[],
) {
  if (!saveOfflineExperiencesResult) {
    return false;
  }

  const unsavedExperiencesNowSavedMap = {} as UpdatedExperiencesMap;

  saveOfflineExperiencesResult.forEach(experienceResult => {
    const {
      experience,
      entriesErrors,
    } = experienceResult as UploadAllUnsavedsMutation_saveOfflineExperiences;

    if (!experience) {
      return;
    }

    const clientId = experience.clientId as string;

    unsavedExperiencesNowSavedMap[clientId] = {
      experience,
      hasError: !!entriesErrors,
    };
  });

  const unsavedExperiencesNowSaved = Object.values(
    unsavedExperiencesNowSavedMap,
  ).map(e => e.experience);

  if (unsavedExperiencesNowSaved.length === 0) {
    return false;
  }

  const savedExperiencesWithUnsavedEntries = [] as ExperienceFragment[];

  const unsavedExperiencesToBeRemovedFromCache: RemoveReferencesToEntityFromCache = [];

  const outstandingUnsavedExperiences = unsavedExperiences.reduce(
    (acc, experience) => {
      const toBeRemoved =
        unsavedExperiencesNowSavedMap[experience.clientId || ""];

      if (!toBeRemoved) {
        acc.push(experience);

        return acc;
      }

      const savedExperience = toBeRemoved.experience;

      const savedEntries = entryNodesFromExperience(savedExperience);

      unsavedExperiencesToBeRemovedFromCache.push({
        id: experience.id,
        typename: experience.__typename,
      });

      if (!toBeRemoved.hasError) {
        return acc;
      }

      const updatedExperience = immer(
        (experience as unknown) as ExperienceFragment,
        proxy => {
          Object.entries(savedExperience).forEach(([k, v]) => {
            if (k !== "entries") {
              proxy[k] = v;
            }
          });

          updateExperienceWithSavedEntries(proxy, savedEntries);
        },
      );

      savedExperiencesWithUnsavedEntries.push(updatedExperience);

      return acc;
    },
    [] as UnsavedExperience[],
  );

  writeUnsavedExperiencesToCache(dataProxy, outstandingUnsavedExperiences);

  writeSavedExperiencesWithUnsavedEntriesToCache(
    dataProxy,
    savedExperiencesWithUnsavedEntries,
  );

  updateGetExperiencesQuery(dataProxy, unsavedExperiencesNowSaved);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const count = removeAllReferencesToEntityFromCache(
    dataProxy,
    unsavedExperiencesToBeRemovedFromCache,
  );

  return true;
}

function updateSavedExperiences(
  dataProxy: DataProxy,
  createEntriesResults: (CreateEntriesResponseFragment | null)[] | null,
  savedExperiencesMap: ExperiencesIdsToObjectMap,
) {
  if (!createEntriesResults) {
    return;
  }

  const updatedExperiencesWithErrors: ExperienceFragment[] = [];
  const updatedExperiences: ExperienceFragment[] = [];

  createEntriesResults.forEach(value => {
    const createEntriesResult = value as CreateEntriesResponseFragment;

    const savedEntries = createEntriesResult.entries as CreateEntriesResponseFragment_entries[];

    if (savedEntries.length === 0) {
      return;
    }

    const { experienceId, errors } = createEntriesResult;

    const experienceWithUnsavedEntriesProps = savedExperiencesMap[experienceId];

    if (!experienceWithUnsavedEntriesProps) {
      return;
    }

    const { experience } = experienceWithUnsavedEntriesProps;

    const experienceUpdated = immer(experience, proxy => {
      updateExperienceWithSavedEntries(proxy, savedEntries);
    });

    writeGetExperienceFullQueryToCache(dataProxy, experienceUpdated);

    updatedExperiences.push(experienceUpdated);

    if (errors) {
      updatedExperiencesWithErrors.push(experienceUpdated);
    }
  });

  if (updatedExperiences.length === 0) {
    return updatedExperiencesWithErrors;
  }

  writeSavedExperiencesWithUnsavedEntriesToCache(
    dataProxy,
    updatedExperiencesWithErrors,
  );

  return updatedExperiences;
}

function updateExperienceWithSavedEntries(
  experience: ExperienceFragment,
  savedEntries: ExperienceFragment_entries_edges_node[],
) {
  const entries = experience.entries as ExperienceFragment_entries;

  const edges = (entries.edges as ExperienceFragment_entries_edges[]).reduce(
    (acc, edge) => {
      const entry = edge.node as ExperienceFragment_entries_edges_node;

      const savedEntry = savedEntries.find(
        ({ clientId }) => clientId === entry.clientId,
      );

      if (savedEntry) {
        edge.node = savedEntry;
      }

      acc.push(edge);
      return acc;
    },
    [] as ExperienceFragment_entries_edges[],
  );

  entries.edges = edges;
  experience.entries = entries;
}

interface UpdatedExperiencesMap {
  [k: string]: {
    experience: ExperienceFragment;
    hasError: boolean;
  };
}

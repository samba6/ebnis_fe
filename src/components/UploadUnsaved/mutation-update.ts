import { FetchResult } from "react-apollo";
import immer from "immer";

import {
  UploadAllUnsavedsMutation,
  UploadAllUnsavedsMutation_saveOfflineExperiences,
} from "../../graphql/apollo-types/UploadAllUnsavedsMutation";
import { ExperiencesIdsToObjectMap } from "./utils";
import {
  GetExperienceFull,
  GetExperienceFullVariables,
} from "../../graphql/apollo-types/GetExperienceFull";
import { GET_EXPERIENCE_FULL_QUERY } from "../../graphql/get-experience-full.query";
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
  getSavedExperiencesWithUnsavedEntriesFromCache,
  writeUnsavedExperiencesToCache,
  removeAllReferencesToEntityFromCache,
  updateGetExperiencesQuery,
  RemoveReferencesToEntityFromCache,
} from "../../state/resolvers-utils";
import { UnsavedExperience } from "../ExperienceDefinition/resolver-utils";
import { entryNodesFromExperience } from "../../state/unsaved-resolvers";

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
  saveOfflineExperiencesResult: Array<UploadAllUnsavedsMutation_saveOfflineExperiences | null> | null,
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

  const count = removeAllReferencesToEntityFromCache(
    dataProxy,
    unsavedExperiencesToBeRemovedFromCache,
  );

  // tslint:disable-next-line:no-console
  console.log(
    "\n\t\tLogging start\n\n\n\n count\n",
    count,
    "\n\n\n\n\t\tLogging ends\n",
  );

  return true;
}

function updateSavedExperiences(
  dataProxy: DataProxy,
  createEntriesResults: Array<CreateEntriesResponseFragment | null> | null,
  savedExperiencesIdsToUnsavedEntriesMap: ExperiencesIdsToObjectMap,
) {
  if (!createEntriesResults) {
    return;
  }

  const updatedExperiencesMap = {} as UpdatedExperiencesMap;

  createEntriesResults.forEach(value => {
    const createEntriesResult = value as CreateEntriesResponseFragment;

    const savedEntries = createEntriesResult.entries as CreateEntriesResponseFragment_entries[];

    if (savedEntries.length === 0) {
      return;
    }

    const { experienceId, errors } = createEntriesResult;

    const experienceWithUnsavedEntriesProps =
      savedExperiencesIdsToUnsavedEntriesMap[experienceId];

    if (!experienceWithUnsavedEntriesProps) {
      return;
    }

    const {
      experience: experienceWithUnsavedEntries,
    } = experienceWithUnsavedEntriesProps;

    const experienceUpdatedWithSavedEntries = immer(
      experienceWithUnsavedEntries,
      proxy => {
        updateExperienceWithSavedEntries(proxy, savedEntries);
      },
    );

    const variables: GetExperienceFullVariables = {
      id: experienceId,
      entriesPagination: {
        first: 20,
      },
    };

    dataProxy.writeQuery<GetExperienceFull, GetExperienceFullVariables>({
      query: GET_EXPERIENCE_FULL_QUERY,
      variables,
      data: {
        getExperience: experienceUpdatedWithSavedEntries,
      },
    });

    updatedExperiencesMap[experienceId] = {
      experience: experienceUpdatedWithSavedEntries,
      hasError: !!errors,
    };
  });

  const updatedExperiences = Object.values(updatedExperiencesMap).map(
    v => v.experience,
  );

  if (updatedExperiences.length === 0) {
    return updatedExperiences;
  }

  const savedExperiencesWithUnsavedEntries = getSavedExperiencesWithUnsavedEntriesFromCache(
    dataProxy,
  ).reduce(
    (acc, e) => {
      const updated = updatedExperiencesMap[e.id];

      if (updated) {
        if (updated.hasError) {
          acc.push(updated.experience);
        }

        return acc;
      }

      acc.push(e);

      return acc;
    },
    [] as ExperienceFragment[],
  );

  writeSavedExperiencesWithUnsavedEntriesToCache(
    dataProxy,
    savedExperiencesWithUnsavedEntries,
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

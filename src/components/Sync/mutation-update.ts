import { FetchResult } from "react-apollo";
import immer from "immer";

// istanbul ignore next: why flag import?
import {
  UploadAllUnsavedsMutation,
  UploadAllUnsavedsMutation_syncOfflineExperiences
} from "../../graphql/apollo-types/UploadAllUnsavedsMutation";
import { ExperiencesIdsToUnsavedEntriesMap } from "./utils";
import {
  GetAnExp_exp_entries,
  GetAnExp_exp_entries_edges,
  GetAnExp_exp_entries_edges_node
} from "../../graphql/apollo-types/GetAnExp";
import { GET_EXP_QUERY } from "../../graphql/get-exp.query";
import { DataProxy } from "apollo-cache";
import {
  CreateEntriesResponseFragment,
  CreateEntriesResponseFragment_entries
} from "../../graphql/apollo-types/CreateEntriesResponseFragment";
import {
  ExperienceFragment,
  ExperienceFragment_entries_edges_node
} from "../../graphql/apollo-types/ExperienceFragment";
import {
  writeSavedExperiencesWithUnsavedEntriesToCache,
  getSavedExperiencesWithUnsavedEntriesFromCache,
  getUnsavedExperiencesFromCache,
  writeUnsavedExperiencesToCache
} from "../../state/resolvers-utils";
import { UnsavedExperience } from "../ExperienceDefinition/resolver-utils";
import { entryNodesFromExperience } from "../../state/unsaved-resolvers";

type UpdaterFn = (
  proxy: DataProxy,
  mutationResult: FetchResult<UploadAllUnsavedsMutation>
) => {
  updatedSavedExperiences?: ExperienceFragment[];
  didUnsavedExperiencesUpdate?: boolean;
};

// istanbul ignore next: trust apollo to do the right thing -
export const onUploadSuccessUpdate: (
  savedExperiencesIdsToUnsavedEntries: ExperiencesIdsToUnsavedEntriesMap
) => UpdaterFn = savedExperiencesIdsToUnsavedEntriesMap => (
  dataProxy,
  { data: uploadResult }
) => {
  if (!uploadResult) {
    return {};
  }

  const { createEntries, syncOfflineExperiences } = uploadResult;

  const updatedSavedExperiences = updateSavedExperiences(
    dataProxy,
    createEntries,
    savedExperiencesIdsToUnsavedEntriesMap
  );

  const didUnsavedExperiencesUpdate = updateUnsavedExperiences(
    dataProxy,
    syncOfflineExperiences
  );

  return {
    updatedSavedExperiences,
    didUnsavedExperiencesUpdate
  };
};

function updateUnsavedExperiences(
  dataProxy: DataProxy,
  syncOfflineExperiences: Array<UploadAllUnsavedsMutation_syncOfflineExperiences | null> | null
) {
  if (!syncOfflineExperiences) {
    return false;
  }

  const experiencesToBeRemovedMap = {} as UpdatedExperiencesMap;
  let toBeRemovedCount = 0;

  syncOfflineExperiences.forEach(experienceResult => {
    const {
      experience,
      entriesErrors
    } = experienceResult as UploadAllUnsavedsMutation_syncOfflineExperiences;

    if (!experience) {
      return;
    }

    const clientId = experience.clientId as string;

    experiencesToBeRemovedMap[clientId] = {
      experience,
      hasError: !!entriesErrors
    };

    ++toBeRemovedCount;
  });

  if (toBeRemovedCount === 0) {
    return false;
  }

  const savedExperiencesWithUnsavedEntries = [] as ExperienceFragment[];

  const outstandingUnsavedExperiences = getUnsavedExperiencesFromCache(
    dataProxy
  ).reduce(
    (acc, experience) => {
      const toBeRemoved = experiencesToBeRemovedMap[experience.clientId || ""];

      if (toBeRemoved) {
        if (toBeRemoved.hasError) {
          const experienceToBeUpdated = toBeRemoved.experience;

          const savedEntries = entryNodesFromExperience(experienceToBeUpdated);

          const updatedExperience = immer(
            (experience as unknown) as ExperienceFragment,
            proxy => {
              Object.entries(experienceToBeUpdated).forEach(([k, v]) => {
                if (k !== "entries") {
                  proxy[k] = v;
                }
              });

              updateExperienceWithSavedEntries(proxy, savedEntries);
            }
          );

          savedExperiencesWithUnsavedEntries.push(updatedExperience);
        }

        return acc;
      }

      acc.push(experience);

      return acc;
    },
    [] as UnsavedExperience[]
  );

  writeUnsavedExperiencesToCache(dataProxy, outstandingUnsavedExperiences);

  writeSavedExperiencesWithUnsavedEntriesToCache(
    dataProxy,
    savedExperiencesWithUnsavedEntries
  );

  return true;
}

function updateSavedExperiences(
  dataProxy: DataProxy,
  createEntries: Array<CreateEntriesResponseFragment | null> | null,
  savedExperiencesIdsToUnsavedEntriesMap: ExperiencesIdsToUnsavedEntriesMap
) {
  if (!createEntries) {
    return;
  }

  const updatedExperiencesMap = {} as UpdatedExperiencesMap;

  createEntries.forEach(value => {
    const operationResponse = value as CreateEntriesResponseFragment;

    const savedEntries = operationResponse.entries as CreateEntriesResponseFragment_entries[];

    if (savedEntries.length === 0) {
      return;
    }

    const { expId, errors } = operationResponse;

    const savedExperience = savedExperiencesIdsToUnsavedEntriesMap[expId];

    if (!savedExperience) {
      return;
    }

    const { experience } = savedExperience;

    const experienceUpdatedWithSavedEntries = immer(experience, proxy => {
      updateExperienceWithSavedEntries(proxy, savedEntries);
    });

    const variables = {
      exp: { id: expId },
      pagination: {
        first: 20
      }
    };

    dataProxy.writeQuery({
      query: GET_EXP_QUERY,
      variables,
      data: {
        exp: experienceUpdatedWithSavedEntries
      }
    });

    updatedExperiencesMap[expId] = {
      experience: experienceUpdatedWithSavedEntries,
      hasError: !!errors
    };
  });

  const updatedExperiences = Object.values(updatedExperiencesMap).map(
    v => v.experience
  );

  if (updatedExperiences.length === 0) {
    return updatedExperiences;
  }

  const savedExperiencesWithUnsavedEntries = getSavedExperiencesWithUnsavedEntriesFromCache(
    dataProxy
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
    [] as ExperienceFragment[]
  );

  writeSavedExperiencesWithUnsavedEntriesToCache(
    dataProxy,
    savedExperiencesWithUnsavedEntries
  );

  return updatedExperiences;
}

function updateExperienceWithSavedEntries(
  experience: ExperienceFragment,
  savedEntries: ExperienceFragment_entries_edges_node[]
) {
  const entries = experience.entries as GetAnExp_exp_entries;

  const edges = (entries.edges as GetAnExp_exp_entries_edges[]).reduce(
    (acc, edge) => {
      const entry = edge.node as GetAnExp_exp_entries_edges_node;

      const savedEntry = savedEntries.find(
        ({ clientId }) => clientId === entry.clientId
      );

      if (savedEntry) {
        edge.node = savedEntry;
      }

      acc.push(edge);
      return acc;
    },
    [] as GetAnExp_exp_entries_edges[]
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

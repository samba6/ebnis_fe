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
import { ExperienceFragment } from "../../graphql/apollo-types/ExperienceFragment";
import {
  writeSavedExperiencesWithUnsavedEntriesToCache,
  getSavedExperiencesWithUnsavedEntriesFromCache
} from "../../state/resolvers-utils";

type UpdaterFn = (
  proxy: DataProxy,
  mutationResult: FetchResult<UploadAllUnsavedsMutation>
) => {
  updatedSavedExperiences?: ExperienceFragment[];
  updatedUnsavedExperiences?: ExperienceFragment[];
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

  const updatedUnsavedExperiences = updateUnsavedExperiences(
    dataProxy,
    syncOfflineExperiences
  );

  return {
    updatedSavedExperiences,
    updatedUnsavedExperiences
  };
};

function updateUnsavedExperiences(
  dataProxy: DataProxy,
  syncOfflineExperiences: Array<UploadAllUnsavedsMutation_syncOfflineExperiences | null> | null
) {
  if (!syncOfflineExperiences) {
    return;
  }

  const updatedExperiencesMap = {} as UpdatedExperiencesMap;

  syncOfflineExperiences.forEach(experienceResult => {
    const {
      experience,
      experienceError,
      entriesErrors
    } = experienceResult as UploadAllUnsavedsMutation_syncOfflineExperiences;

    if (experienceError) {
      return;
    }
  });

  const updatedExperiences = Object.values(updatedExperiencesMap).map(
    v => v.experience
  );

  return updatedExperiences;
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
    const success = value as CreateEntriesResponseFragment;

    const successEntries = success.entries as CreateEntriesResponseFragment_entries[];

    if (successEntries.length === 0) {
      return;
    }

    const { expId, errors } = success;

    const savedExperience = savedExperiencesIdsToUnsavedEntriesMap[expId];

    if (!savedExperience) {
      return;
    }

    const { experience } = savedExperience;

    const updatedExperience = immer(experience, proxy => {
      const entries = proxy.entries as GetAnExp_exp_entries;

      const edges = (entries.edges as GetAnExp_exp_entries_edges[]).reduce(
        (acc, edge) => {
          const entry = edge.node as GetAnExp_exp_entries_edges_node;

          const successEntry = successEntries.find(
            ({ clientId }) => clientId === entry.clientId
          );

          if (successEntry) {
            edge.node = successEntry;
          }

          acc.push(edge);
          return acc;
        },
        [] as GetAnExp_exp_entries_edges[]
      );

      entries.edges = edges;
      proxy.entries = entries;
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
        exp: updatedExperience
      }
    });

    updatedExperiencesMap[expId] = {
      experience: updatedExperience,
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

interface UpdatedExperiencesMap {
  [k: string]: {
    experience: ExperienceFragment;
    hasError: boolean;
  };
}

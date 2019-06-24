import { MutationUpdaterFn } from "react-apollo";
import immer from "immer";

// istanbul ignore next: why flag import?
import { UploadAllUnsavedsMutation } from "../../graphql/apollo-types/UploadAllUnsavedsMutation";
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

// istanbul ignore next: trust apollo to do the right thing -
export const onUploadSuccessUpdate: (
  savedExperiencesIdsToUnsavedEntries: ExperiencesIdsToUnsavedEntriesMap
) => MutationUpdaterFn<
  UploadAllUnsavedsMutation
> = savedExperiencesIdsToUnsavedEntriesMap => async (
  dataProxy,
  { data: uploadResult }
) => {
  if (!uploadResult) {
    return;
  }

  const { createEntries, syncOfflineExperiences } = uploadResult;

  updateSavedExperiences(
    dataProxy,
    createEntries,
    savedExperiencesIdsToUnsavedEntriesMap
  );

  // tslint:disable-next-line:no-console
  console.log(
    "\n\t\tLogging start\n\n\n\n syncOfflineExperiences\n",

    syncOfflineExperiences,
    "\n\n\n\n\t\tLogging ends\n"
  );

  return true;
};

function updateSavedExperiences(
  dataProxy: DataProxy,
  createEntries: Array<CreateEntriesResponseFragment | null> | null,
  savedExperiencesIdsToUnsavedEntriesMap: ExperiencesIdsToUnsavedEntriesMap
) {
  if (!createEntries) {
    return;
  }

  createEntries.forEach(value => {
    const success = value as CreateEntriesResponseFragment;

    const expId = success.expId;

    const successEntries = success.entries as CreateEntriesResponseFragment_entries[];

    const experienceObj = savedExperiencesIdsToUnsavedEntriesMap[expId];

    if (!experienceObj) {
      return;
    }

    const { experience } = experienceObj;

    const updatedExperience = immer(experience, proxy => {
      const entries = proxy.entries as GetAnExp_exp_entries;

      const edges = (entries.edges as GetAnExp_exp_entries_edges[]).reduce(
        (acc, edge) => {
          const entry = edge.node as GetAnExp_exp_entries_edges_node;

          const successEntry = successEntries.find(
            mayBeSuccessEntry => mayBeSuccessEntry.clientId === entry.clientId
          );

          if (successEntry) {
            edge.node = successEntry;
            acc.push(edge);
            return acc;
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
  });
}

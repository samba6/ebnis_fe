import { DataProxy } from "apollo-cache";
import {
  getExperiencesMiniQuery,
  readOptions,
} from "./get-experiences-mini-query";
import {
  GetExperienceConnectionMini,
  GetExperienceConnectionMiniVariables,
} from "../graphql/apollo-types/GetExperienceConnectionMini";
import immer from "immer";
import {
  ExperienceConnectionFragment_edges,
  ExperienceConnectionFragment_edges_node,
} from "../graphql/apollo-types/ExperienceConnectionFragment";
import { readExperienceFragment } from "./read-experience-fragment";
import {
  ExperienceFragment,
  ExperienceFragment_entries_edges,
} from "../graphql/apollo-types/ExperienceFragment";
import { DataDefinitionFragment } from "../graphql/apollo-types/DataDefinitionFragment";
import { EntryFragment } from "../graphql/apollo-types/EntryFragment";
import { DataObjectFragment } from "../graphql/apollo-types/DataObjectFragment";
import {
  wipeReferencesFromCache,
  removeQueriesAndMutationsFromCache,
} from "../state/resolvers/delete-references-from-cache";
import { InMemoryCache } from "apollo-cache-inmemory";
import { removeUnsyncedExperiences } from "./unsynced.resolvers";

export function deleteExperiencesFromCache(
  dataProxy: DataProxy,
  ids: string[],
) {
  const experienceConnection = getExperiencesMiniQuery(dataProxy);

  if (!experienceConnection) {
    return;
  }

  const idMap = ids.reduce((acc, id) => {
    acc[id] = true;
    return acc;
  }, {} as { [k: string]: true });

  const toDeletes: string[] = [];
  let was_deleted = false;

  const updatedExperienceConnection = immer(experienceConnection, proxy => {
    const edges = proxy.edges as ExperienceConnectionFragment_edges[];
    const newEdges: ExperienceConnectionFragment_edges[] = [];

    edges.forEach(e => {
      const { id } = (e as ExperienceConnectionFragment_edges)
        .node as ExperienceConnectionFragment_edges_node;

      if (idMap[id]) {
        toDeletes.push(id);
        deleteExperienceOffsprings(dataProxy, id, toDeletes);
        was_deleted = true;
      } else {
        newEdges.push(e);
      }
    });

    proxy.edges = newEdges;
  });

  if (!was_deleted) {
    return;
  }

  wipeReferencesFromCache(dataProxy as InMemoryCache, toDeletes);

  dataProxy.writeQuery<
    GetExperienceConnectionMini,
    GetExperienceConnectionMiniVariables
  >({
    ...readOptions,
    data: { getExperiences: updatedExperienceConnection },
  });

  removeUnsyncedExperiences(ids);

  if (
    !(updatedExperienceConnection.edges as ExperienceConnectionFragment_edges[])
      .length
  ) {
    removeQueriesAndMutationsFromCache(dataProxy as InMemoryCache, [
      "getExperiences",
    ]);
  }
}

function deleteExperienceOffsprings(
  dataProxy: DataProxy,
  id: string,
  toDeletes: string[],
) {
  const { dataDefinitions, entries } = readExperienceFragment(
    dataProxy,
    id,
  ) as ExperienceFragment;

  dataDefinitions.forEach(d => {
    toDeletes.push((d as DataDefinitionFragment).id);
  });

  (entries.edges as ExperienceFragment_entries_edges[]).forEach(e => {
    const entry = (e as ExperienceFragment_entries_edges).node as EntryFragment;
    toDeletes.push(entry.id);

    (entry.dataObjects as DataObjectFragment[]).forEach(d => {
      toDeletes.push((d as DataObjectFragment).id);
    });
  });
}

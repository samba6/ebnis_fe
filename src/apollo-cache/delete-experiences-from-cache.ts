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
import { AppPersistor } from "../context";

export async function deleteExperiencesFromCache(
  dataProxy: DataProxy,
  persistor: AppPersistor,
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
  let len = 0;
  let totalRemoved = 0;

  const updatedExperienceConnection = immer(experienceConnection, proxy => {
    const edges = proxy.edges as ExperienceConnectionFragment_edges[];
    const newEdges: ExperienceConnectionFragment_edges[] = [];

    edges.forEach(e => {
      const { id } = (e as ExperienceConnectionFragment_edges)
        .node as ExperienceConnectionFragment_edges_node;

      if (idMap[id]) {
        ++totalRemoved;
        toDeletes.push(id);

        deleteExperienceOffsprings(dataProxy, id, toDeletes);
        was_deleted = true;
      } else {
        newEdges.push(e);
      }
    });

    proxy.edges = newEdges;
    len = newEdges.length;
  });

  if (!was_deleted) {
    return;
  }

  dataProxy.writeQuery<
    GetExperienceConnectionMini,
    GetExperienceConnectionMiniVariables
  >({
    ...readOptions,
    data: { getExperiences: updatedExperienceConnection },
  });
  await persistor.persist();

  if (len === 0) {
    removeQueriesAndMutationsFromCache(dataProxy as InMemoryCache, [
      "getExperiences",
    ]);
  } else {
    const end = len + totalRemoved;

    for (; len < end; len++) {
      const c = `ROOT_QUERY\\.getExperiences\\(\\{"input"\\:\\{"pagination"\\:\\{"first"\\:20000\\}\\}\\}\\)\\.edges\\.${len}`;

      toDeletes.push(c);
    }
  }

  wipeReferencesFromCache(dataProxy as InMemoryCache, toDeletes);

  removeUnsyncedExperiences(ids);

  await persistor.persist();
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

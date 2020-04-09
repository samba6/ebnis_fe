import { DataProxy } from "apollo-cache";
import {
  getExperiencesMiniQuery,
  readOptions,
} from "./get-experiences-mini-query";
import {
  GetExperienceConnectionMini,
  GetExperienceConnectionMiniVariables,
  GetExperienceConnectionMini_getExperiences,
} from "../graphql/apollo-types/GetExperienceConnectionMini";
import immer from "immer";
import { ExperienceConnectionFragment_edges } from "../graphql/apollo-types/ExperienceConnectionFragment";
import { ExperienceFragment } from "../graphql/apollo-types/ExperienceFragment";
import {
  wipeReferencesFromCache,
  removeQueriesAndMutationsFromCache,
} from "../state/resolvers/delete-references-from-cache";
import { InMemoryCache } from "apollo-cache-inmemory";
import { removeUnsyncedExperiences } from "./unsynced.resolvers";
import { AppPersistor } from "../context";
import { isOfflineId } from "../constants";
import { DataDefinitionFragment } from "../graphql/apollo-types/DataDefinitionFragment";
import { EntryConnectionFragment_edges } from "../graphql/apollo-types/EntryConnectionFragment";
import { EntryFragment } from "../graphql/apollo-types/EntryFragment";
import { DataObjectFragment } from "../graphql/apollo-types/DataObjectFragment";
import { readExperienceFragment } from "./read-experience-fragment";

export const GET_EXPERIENCES_MINI_ROOT_QUERY_KEY_PREFIX = `ROOT_QUERY\\.getExperiences\\(\\{"input"\\:\\{"pagination"\\:\\{"first"\\:20000\\}\\}\\}\\)\\.edges\\.`;

export async function deleteExperiencesFromCache(
  dataProxy: DataProxy,
  persistor: AppPersistor,
  ids: string[],
) {
  const experienceConnection = getExperiencesMiniQuery(dataProxy);

  if (!experienceConnection) {
    return;
  }

  const result = getOpsData(ids, experienceConnection);

  // istanbul ignore next:
  if (!result) {
    return;
  }

  const [
    newEdges,
    offlineExperiencesReferencesToWipe,
    onlineExperiencesReferencesToWipe,
    unsyncedLedgerIdsToRemove,
    getExperiencesEdgesKeyToRemove,
  ] = result;

  if (newEdges.length) {
    const updatedExperienceConnection = immer(experienceConnection, proxy => {
      proxy.edges = newEdges;
    });

    dataProxy.writeQuery<
      GetExperienceConnectionMini,
      GetExperienceConnectionMiniVariables
    >({
      ...readOptions,
      data: { getExperiences: updatedExperienceConnection },
    });

    await persistor.persist();
  } else {
    removeQueriesAndMutationsFromCache(dataProxy as InMemoryCache, [
      "getExperiences",
    ]);
  }

  wipeReferencesFromCache(
    dataProxy as InMemoryCache,
    onlineExperiencesReferencesToWipe
      .concat(getDescendantsIds(dataProxy, onlineExperiencesReferencesToWipe))
      .concat(offlineExperiencesReferencesToWipe)
      .concat(getExperiencesEdgesKeyToRemove),
  );

  removeUnsyncedExperiences(unsyncedLedgerIdsToRemove);
  await persistor.persist();
}

export function getOpsData(
  ids: string[],
  experienceConnection: GetExperienceConnectionMini_getExperiences,
): GetOpsReturn | null {
  const newEdges: ExperienceConnectionFragment_edges[] = [];
  const offlineExperiencesReferencesToWipe: OfflineExperienceIdsToWipe = [];
  const onlineExperiencesReferencesToWipe: OfflineExperienceIdsToWipe = [];
  const unsyncedLedgerIdsToRemove: UnsyncedLedgerIdsToRemove = [];
  const getExperiencesEdgesKeyToRemove: GetExperiencesEdgesKeyToRemove = [];

  const idsMap = ids.reduce(
    (acc, id) => {
      acc[id] = true;
      return acc;
    },
    {} as {
      [experienceId: string]: true;
    },
  );

  const edges = experienceConnection.edges as ExperienceConnectionFragment_edges[];

  edges.forEach(e => {
    const edge = e as ExperienceConnectionFragment_edges;
    const node = edge.node as ExperienceFragment;
    const { id } = node;

    if (idsMap[id]) {
      unsyncedLedgerIdsToRemove.push(id);
      if (isOfflineId(id)) {
        offlineExperiencesReferencesToWipe.push(id);
      } else {
        onlineExperiencesReferencesToWipe.push(id);
      }
    } else {
      newEdges.push(edge);
    }
  });

  const newEdgesLen = newEdges.length;
  const edgesLen = edges.length;

  if (newEdgesLen === edgesLen) {
    return null;
  }

  if (newEdgesLen && newEdgesLen < edgesLen) {
    for (let index = newEdgesLen; index < edgesLen; index++) {
      getExperiencesEdgesKeyToRemove.push(
        GET_EXPERIENCES_MINI_ROOT_QUERY_KEY_PREFIX + index,
      );
    }
  }

  return [
    newEdges,
    offlineExperiencesReferencesToWipe,
    onlineExperiencesReferencesToWipe,
    unsyncedLedgerIdsToRemove,
    getExperiencesEdgesKeyToRemove,
  ];
}

function getDescendantsIds(dataProxy: DataProxy, ids: string[]) {
  return ids.reduce((acc, id) => {
    const experience = readExperienceFragment(dataProxy, id);

    if (experience) {
      acc.push(...getDescendantId(experience));
    }

    return acc;
  }, [] as string[]);
}

export function getDescendantId(experience: ExperienceFragment) {
  const ids: string[] = [];

  const { entries, dataDefinitions } = experience;

  dataDefinitions.forEach(d => {
    ids.push((d as DataDefinitionFragment).id);
  });

  (entries.edges as EntryConnectionFragment_edges[]).forEach(e => {
    const entry = (e as EntryConnectionFragment_edges).node as EntryFragment;
    ids.push(entry.id);

    entry.dataObjects.forEach(d => {
      ids.push((d as DataObjectFragment).id);
    });
  });

  return ids;
}

type OfflineExperienceIdsToWipe = string[];
type OnlineExperienceIdsToWipe = string[];
type UnsyncedLedgerIdsToRemove = string[];
type GetExperiencesEdgesKeyToRemove = string[];

export type GetOpsReturn = [
  ExperienceConnectionFragment_edges[],
  OfflineExperienceIdsToWipe,
  OnlineExperienceIdsToWipe,
  UnsyncedLedgerIdsToRemove,
  GetExperiencesEdgesKeyToRemove,
];

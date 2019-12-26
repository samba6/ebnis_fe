/* eslint-disable @typescript-eslint/no-explicit-any */
import { updateCache } from "../components/UploadOfflineItems/update-cache";
import { ExperiencesIdsToObjectMap } from "../components/UploadOfflineItems/upload-offline.utils";
import {
  ExperienceFragment,
  ExperienceFragment_entries_edges_node,
  ExperienceFragment_entries,
  ExperienceFragment_entries_edges,
  ExperienceFragment_dataDefinitions,
} from "../graphql/apollo-types/ExperienceFragment";

jest.mock("../state/resolvers/update-get-experiences-mini-query");
jest.mock("../state/resolvers/write-get-experience-full-query-to-cache");
jest.mock("../state/resolvers/delete-references-from-cache");
jest.mock("../state/resolvers/update-experiences-in-cache");

import { deleteIdsFromCache } from "../state/resolvers/delete-references-from-cache";
import { replaceExperiencesInGetExperiencesMiniQuery } from "../state/resolvers/update-get-experiences-mini-query";
import { writeGetExperienceFullQueryToCache } from "../state/resolvers/write-get-experience-full-query-to-cache";
import { writeOfflineItemsToCache } from "../state/resolvers/update-experiences-in-cache";
import {
  MUTATION_NAME_createOfflineEntry,
  MUTATION_NAME_createExperienceOffline,
  QUERY_NAME_getExperience,
} from "../state/resolvers";
import { OFFLINE_ITEMS_TYPENAME } from "../state/offline-resolvers";
import { CreateEntriesErrorsFragment_errors } from "../graphql/apollo-types/CreateEntriesErrorsFragment";
import { EntryFragment_dataObjects } from "../graphql/apollo-types/EntryFragment";
import { DataObjectFragment } from "../graphql/apollo-types/DataObjectFragment";

const mockDeleteIdsFromCache = deleteIdsFromCache as jest.Mock;

const mockReplaceExperiencesInGetExperiencesMiniQuery = replaceExperiencesInGetExperiencesMiniQuery as jest.Mock;

const mockWriteGetExperienceFullQueryToCache = writeGetExperienceFullQueryToCache as jest.Mock;

const mockWriteSavedAndUnsavedExperiencesToCache = writeOfflineItemsToCache as jest.Mock;

beforeEach(() => {
  jest.resetAllMocks();
});

test("completely saved unsaved experience", () => {
  const completelyOfflineMap = {
    "1": {
      experience: {
        id: "1",
        clientId: "1",
        dataDefinitions: [
          {
            id: "1",
          },
        ] as ExperienceFragment_dataDefinitions[],
        entries: {
          edges: [
            {
              node: {},
            },
          ] as ExperienceFragment_entries_edges[],
        } as ExperienceFragment_entries,
      } as ExperienceFragment,

      offlineEntries: [],
      onlineEntries: [],
      newlyOnlineEntries: [],
      newlySavedExperience: {
        id: "1s",
        clientId: "1",
        entries: {
          edges: [] as ExperienceFragment_entries_edges[],
        },
      } as ExperienceFragment,
    },
  };

  const outstandingUnsavedCount = updateCache({
    completelyOfflineMap,
    partialOnlineMap: {},
    cache: {} as any,
    client: {} as any,
  });

  expect(outstandingUnsavedCount).toBe(0);
  expect(mockWriteGetExperienceFullQueryToCache).toHaveBeenCalledTimes(1);

  expect(mockDeleteIdsFromCache).toHaveBeenCalledWith(
    {},
    ["Experience:1", "DataDefinition:1", `${OFFLINE_ITEMS_TYPENAME}:1`],
    {
      mutations: [[MUTATION_NAME_createExperienceOffline, "Experience:1"]],

      queries: [[QUERY_NAME_getExperience, "Experience:1"]],
    },
  );

  expect(
    mockReplaceExperiencesInGetExperiencesMiniQuery.mock.calls[0][1],
  ).toEqual({
    "1": {
      id: "1s",
      clientId: "1",
      entries: {
        edges: [],
      },
    },
  });

  expect(mockWriteSavedAndUnsavedExperiencesToCache.mock.calls[0][1]).toEqual(
    [],
  );
});

test("partially saved unsaved experience", () => {
  const completelyOfflineMap = {
    "2": {
      // experience partially saved, will be deleted from cache
      experience: {
        id: "2",
        clientId: "2",
        dataDefinitions: [
          {
            id: "1",
          },
        ] as ExperienceFragment_dataDefinitions[],

        entries: {
          edges: [
            {
              node: {},
            },
          ] as ExperienceFragment_entries_edges[],
        } as ExperienceFragment_entries,
      } as ExperienceFragment,
      // one of these entries (21) failed to save -hence this experience is
      // partially saved
      offlineEntries: [
        {
          id: "unsaved-entry",
        }, // did not save - notice it has same ID as entriesErrors

        {
          id: "saved-entry",
        }, // saved, will be deleted from cache
      ] as ExperienceFragment_entries_edges_node[],

      entriesErrors: {
        "unsaved-entry": {} as CreateEntriesErrorsFragment_errors,
      },

      onlineEntries: [], // an unsaved experience never has savedEntries

      newlySavedExperience: {
        id: "2s",
        clientId: "2",
        entries: {
          edges: [
            {
              node: {
                clientId: "saved-entry",

                dataObjects: [
                  {
                    clientId: "saved-data-object",
                  },
                ] as EntryFragment_dataObjects[],
              },
            },
          ] as ExperienceFragment_entries_edges[],
        },
      } as ExperienceFragment,
    },
  };

  const outstandingUnsavedCount = updateCache({
    completelyOfflineMap,
    partialOnlineMap: {},
    cache: {} as any,
    client: {} as any,
  });

  expect(outstandingUnsavedCount).toBe(1);
  expect(mockWriteGetExperienceFullQueryToCache).toHaveBeenCalledTimes(1);

  expect(mockDeleteIdsFromCache).toHaveBeenCalledWith(
    {},
    [
      "Experience:2",
      "DataDefinition:1",
      "Entry:saved-entry",
      "DataObject:saved-data-object",
    ],
    {
      mutations: [
        [MUTATION_NAME_createExperienceOffline, "Experience:2"],
        [MUTATION_NAME_createOfflineEntry, "Entry:saved-entry"],
        [MUTATION_NAME_createOfflineEntry, "Entry:unsaved-entry"],
      ],

      queries: [[QUERY_NAME_getExperience, "Experience:2"]],
    },
  );

  expect(
    mockReplaceExperiencesInGetExperiencesMiniQuery.mock.calls[0][1],
  ).toEqual({
    "2": {
      hasUnsaved: true,
      id: "2s",
      clientId: "2",
      entries: {
        edges: [
          {
            node: {
              clientId: "saved-entry",

              dataObjects: [
                {
                  clientId: "saved-data-object",
                },
              ],
            },
          },

          {
            __typename: "EntryEdge",
            cursor: "",
            node: {
              id: "unsaved-entry",
            },
          },
        ],
      },
    },
  });

  expect(mockWriteSavedAndUnsavedExperiencesToCache.mock.calls[0][1]).toEqual([
    {
      id: "2s",
      offlineEntriesCount: 1,
      __typename: OFFLINE_ITEMS_TYPENAME,
    },
  ]);
});

test("unsaved experience not saved", () => {
  const completelyOfflineMap = {
    "3": {
      // newlySavedExperience = undefined, outstanding unsaved count = 2
      experience: {
        id: "3",
      } as ExperienceFragment,
      // since experience did not save, ditto entry. outstanding unsaved
      // count = 3
      offlineEntries: [{} as ExperienceFragment_entries_edges_node],
      entriesErrors: {},
      onlineEntries: [],
      newlyOnlineEntries: [],
    },
  };

  const outstandingUnsavedCount = updateCache({
    completelyOfflineMap,
    partialOnlineMap: {},
    cache: {} as any,
    client: {} as any,
  });

  expect(outstandingUnsavedCount).toBe(2);
  expect(mockWriteGetExperienceFullQueryToCache).not.toHaveBeenCalled();

  expect(mockDeleteIdsFromCache).not.toHaveBeenCalled();

  expect(
    mockReplaceExperiencesInGetExperiencesMiniQuery,
  ).not.toHaveBeenCalled();

  expect(mockWriteSavedAndUnsavedExperiencesToCache.mock.calls[0][1]).toEqual([
    {
      id: "3",
      offlineEntriesCount: 1,
      __typename: OFFLINE_ITEMS_TYPENAME,
    },
  ]);
});

test("saved experience with unsaved entry not saved", () => {
  const partialOnlineMap = {
    "6": {
      // has an unsaved entry, so we will put it back in savedUnsaved
      experience: {
        id: "6",
        entries: {
          edges: [
            {
              // a previously unsaved entry now saved

              node: {
                id: "22",
                clientId: "22-c", // will be deleted from cache
              },
            },

            // this has always been a saved entry - must not be touched.
            {
              node: {
                id: "23",
                clientId: "23-c",
              },
            },
          ] as ExperienceFragment_entries_edges[],
        },
      } as ExperienceFragment,
      offlineEntries: [],
      onlineEntries: [],
      newlyOnlineEntries: [
        {
          id: "22s",
          clientId: "22-c",

          dataObjects: [] as DataObjectFragment[],
        } as ExperienceFragment_entries_edges_node,
      ],
      // so we have one entry we are unable to save,
      // outstanding unsaved count = 6
      entriesErrors: {
        yy: {} as CreateEntriesErrorsFragment_errors,
      },
    },
  };

  const outstandingUnsavedCount = updateCache({
    completelyOfflineMap: {},
    partialOnlineMap,
    cache: {} as any,
    client: {} as any,
  });

  const finalEdges = [
    {
      node: {
        clientId: "22-c",
        id: "22s",

        dataObjects: [],
      },
    },

    {
      node: {
        clientId: "23-c",
        id: "23",
      },
    },
  ];

  expect(mockWriteGetExperienceFullQueryToCache.mock.calls[0][1]).toEqual({
    id: "6",
    entries: {
      edges: finalEdges,
    },
  });

  expect(outstandingUnsavedCount).toBe(1);

  expect(mockDeleteIdsFromCache).toHaveBeenCalledWith({}, ["Entry:22-c"], {
    mutations: [[MUTATION_NAME_createOfflineEntry, "Entry:22-c"]],

    queries: [],
  });

  expect(
    mockReplaceExperiencesInGetExperiencesMiniQuery.mock.calls[0][1],
  ).toEqual({
    "6": {
      id: "6",
      entries: {
        edges: finalEdges,
      },
    },
  });

  expect(mockWriteSavedAndUnsavedExperiencesToCache.mock.calls[0][1]).toEqual([
    {
      id: "6",
      offlineEntriesCount: 1,
      __typename: OFFLINE_ITEMS_TYPENAME,
    },
  ]);
});

test("saved experience with no 'newlyOnlineEntries' ", () => {
  const partialOnlineMap = {
    "4": {
      experience: {
        id: "4",
      },
      // newlyOnlineEntries = undefined
      offlineEntries: [{}],
    } as any,
  } as ExperiencesIdsToObjectMap;

  const outstandingUnsavedCount = updateCache({
    completelyOfflineMap: {},
    partialOnlineMap,
    cache: {} as any,
    client: {} as any,
  });

  expect(mockWriteGetExperienceFullQueryToCache).not.toHaveBeenCalled();

  expect(outstandingUnsavedCount).toBe(1);
  expect(mockDeleteIdsFromCache).not.toHaveBeenCalled();

  expect(
    mockReplaceExperiencesInGetExperiencesMiniQuery,
  ).not.toHaveBeenCalled();

  expect(mockWriteSavedAndUnsavedExperiencesToCache.mock.calls[0][1]).toEqual([
    {
      id: "4",
      offlineEntriesCount: 1,
      __typename: OFFLINE_ITEMS_TYPENAME,
    },
  ]);
});

test("saved experience with empty 'newlyOnlineEntries' ", () => {
  const partialOnlineMap = {
    "5": {
      experience: {
        id: "5",
      },
      offlineEntries: [{}],
      newlyOnlineEntries: [],
    } as any,
  } as ExperiencesIdsToObjectMap;

  const outstandingUnsavedCount = updateCache({
    completelyOfflineMap: {},
    partialOnlineMap,
    cache: {} as any,
    client: {} as any,
  });

  expect(mockWriteGetExperienceFullQueryToCache).not.toHaveBeenCalled();

  expect(outstandingUnsavedCount).toBe(1);
  expect(mockDeleteIdsFromCache).not.toHaveBeenCalled();

  expect(
    mockReplaceExperiencesInGetExperiencesMiniQuery,
  ).not.toHaveBeenCalled();

  expect(mockWriteSavedAndUnsavedExperiencesToCache.mock.calls[0][1]).toEqual([
    {
      id: "5",
      offlineEntriesCount: 1,
      __typename: OFFLINE_ITEMS_TYPENAME,
    },
  ]);
});

test("saved experience completely saved", () => {
  const partialOnlineMap = {
    "7": {
      experience: {
        id: "7",
        entries: {
          edges: [] as ExperienceFragment_entries_edges[],
        },
      } as ExperienceFragment,
      offlineEntries: [],
      onlineEntries: [],
      newlyOnlineEntries: [
        {
          clientId: "71-c",

          dataObjects: [
            {
              clientId: "1",
            },
          ],
        },
      ] as ExperienceFragment_entries_edges_node[],
    },
  } as ExperiencesIdsToObjectMap;

  const outstandingUnsavedCount = updateCache({
    completelyOfflineMap: {},
    partialOnlineMap,
    cache: {} as any,
    client: {} as any,
  });

  expect(mockWriteGetExperienceFullQueryToCache.mock.calls[0][1]).toEqual({
    id: "7",
    entries: { edges: [] },
    hasUnsaved: null,
  });

  expect(outstandingUnsavedCount).toBe(0);

  expect(mockDeleteIdsFromCache).toHaveBeenCalledWith(
    {},
    ["Entry:71-c", "DataObject:1", `${OFFLINE_ITEMS_TYPENAME}:7`],
    {
      mutations: [[MUTATION_NAME_createOfflineEntry, "Entry:71-c"]],

      queries: [],
    },
  );

  expect(
    mockReplaceExperiencesInGetExperiencesMiniQuery.mock.calls[0][1],
  ).toEqual({
    "7": {
      id: "7",
      entries: { edges: [] },
      hasUnsaved: null,
    },
  });

  expect(mockWriteSavedAndUnsavedExperiencesToCache.mock.calls[0][1]).toEqual(
    [],
  );
});

it("is a noop when updating and there is nothing to update", () => {
  const outstandingUnsavedCount = updateCache({
    completelyOfflineMap: {},
    partialOnlineMap: {},
    cache: {} as any,
    client: {} as any,
  });

  expect(outstandingUnsavedCount).toBe(0);

  expect(mockDeleteIdsFromCache).not.toHaveBeenCalled();

  expect(
    mockReplaceExperiencesInGetExperiencesMiniQuery,
  ).not.toHaveBeenCalled();

  expect(mockWriteGetExperienceFullQueryToCache).not.toHaveBeenCalled();

  expect(mockWriteSavedAndUnsavedExperiencesToCache).not.toHaveBeenCalled();
});

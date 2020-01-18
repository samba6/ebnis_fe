/* eslint-disable @typescript-eslint/no-explicit-any */
import { updateCache } from "../components/UploadOfflineItems/update-cache";
import {
  ExperienceFragment,
  ExperienceFragment_entries_edges_node,
  ExperienceFragment_entries,
  ExperienceFragment_entries_edges,
  ExperienceFragment_dataDefinitions,
} from "../graphql/apollo-types/ExperienceFragment";
import {
  wipeReferencesFromCache,
  removeQueriesAndMutationsFromCache,
} from "../state/resolvers/delete-references-from-cache";
import { replaceExperiencesInGetExperiencesMiniQuery } from "../apollo-cache/update-get-experiences-mini-query";
import { updateOfflineItemsLedger } from "../apollo-cache/write-offline-items-to-cache";
import { CreateEntriesErrorsFragment_errors } from "../graphql/apollo-types/CreateEntriesErrorsFragment";
import {
  EntryFragment_dataObjects,
  EntryFragment,
} from "../graphql/apollo-types/EntryFragment";
import { writeExperienceFragmentToCache } from "../apollo-cache/write-experience-fragment";
import { makeApolloCacheRef } from "../constants";
import {
  EXPERIENCE_TYPE_NAME,
  DATA_DEFINITION_TYPE_NAME,
  ENTRY_TYPE_NAME,
  DATA_OBJECT_TYPE_NAME,
} from "../graphql/types";
import { decrementOfflineEntriesCountForExperiences } from "../apollo-cache/drecrement-offline-entries-count";
import { readExperienceFragment } from "../apollo-cache/read-experience-fragment";

jest.mock("../apollo-cache/read-experience-fragment");
const mockreadExperienceFragment = readExperienceFragment as jest.Mock;

jest.mock("../apollo-cache/update-get-experiences-mini-query");
const mockReplaceExperiencesInGetExperiencesMiniQuery = replaceExperiencesInGetExperiencesMiniQuery as jest.Mock;

jest.mock("../state/resolvers/delete-references-from-cache");
const mockWipeReferencesFromCache = wipeReferencesFromCache as jest.Mock;
const mockRemoveQueriesAndMutationsFromCache = removeQueriesAndMutationsFromCache as jest.Mock;

jest.mock("../apollo-cache/write-offline-items-to-cache");
const mockUpdateOfflineItemsLedger = updateOfflineItemsLedger as jest.Mock;

jest.mock("../apollo-cache/write-experience-fragment");
const mockWriteExperienceFragmentToCache = writeExperienceFragmentToCache as jest.Mock;

jest.mock("../apollo-cache/drecrement-offline-entries-count");
const mockDecrementOfflineEntriesCountForExperiences = decrementOfflineEntriesCountForExperiences as jest.Mock;

beforeEach(() => {
  jest.resetAllMocks();
});

test("mixed", () => {
  const completelyOfflineMap = {
    // experience onine, entry online, entry offline
    ex1Off: {
      experience: {
        id: "ex1Off",
        clientId: "ex1Off",
        dataDefinitions: [
          {
            id: "def11Off",
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
      // en1Off never made it online - so this experience is partOffline
      offlineEntries: [
        {
          id: "en11Off",
        }, // still offline - notice it has same ID as entriesErrors
        {
          id: "en12Off", // successfully online
        },
      ] as ExperienceFragment_entries_edges_node[],

      entriesErrors: {
        en11Off: {} as CreateEntriesErrorsFragment_errors,
      },
      newlySavedExperience: {
        id: "ex1On",
        clientId: "ex1Off",
        entries: {
          edges: [
            {
              node: {
                id: "en12On",
                clientId: "en12Off",
                dataObjects: [
                  {
                    clientId: "da12Off",
                  },
                ] as EntryFragment_dataObjects[],
              },
            },
          ] as ExperienceFragment_entries_edges[],
        },
      } as ExperienceFragment,
    },
    // experience offline, entry offline
    ex2Off: {
      experience: {
        id: "ex2Off",
        clientId: "ex2Off",
      } as ExperienceFragment,
      offlineEntries: [{} as any],
    },
    // experience offline, no entry
    ex3Off: {
      experience: {
        id: "ex3Off",
        clientId: "ex3Off",
      } as ExperienceFragment,
      offlineEntries: [],
    },
    // experience online, entry online
    ex4Off: {
      experience: {
        id: "ex4Off",
        clientId: "ex4Off",
        dataDefinitions: [
          {
            id: "def41Off",
          },
        ] as ExperienceFragment_dataDefinitions[],
      } as ExperienceFragment,
      offlineEntries: [
        {
          id: "en41Off",
        },
      ] as ExperienceFragment_entries_edges_node[],
      newlySavedExperience: {
        id: "ex4On",
        clientId: "ex4Off",
        entries: {
          edges: [
            {
              node: {
                id: "en41On",
                clientId: "en41Off",
                dataObjects: [
                  {
                    clientId: "da41Off",
                  },
                ] as EntryFragment_dataObjects[],
              },
            },
          ] as ExperienceFragment_entries_edges[],
        },
      } as ExperienceFragment,
    },
    // online no entry
    ex5Off: {
      experience: {
        id: "ex5Off",
        clientId: "ex5Off",
        dataDefinitions: [
          {
            id: "def51Off",
          },
        ] as ExperienceFragment_dataDefinitions[],
      } as ExperienceFragment,
      offlineEntries: [],
      newlySavedExperience: {
        id: "ex5On",
        clientId: "ex5Off",
        entries: {},
      } as ExperienceFragment,
    },
  };

  const partialOnlineMap = {
    // no entry (1) succeeded, newOnlineEntries === undefined
    ex6On: {
      experience: {} as ExperienceFragment,
      offlineEntries: [{} as EntryFragment],
    },
    // no entry (1) succeeded, newlyOnlineEntries.length === 0
    ex7On: {
      experience: {} as ExperienceFragment,
      offlineEntries: [{} as EntryFragment],
      newlyOnlineEntries: [],
    },
    // all entries (1) succeeded
    ex8On: {
      experience: {} as ExperienceFragment,
      offlineEntries: [],
      newlyOnlineEntries: [
        {
          id: "en81On",
          clientId: "en81Off",
          dataObjects: [
            {
              clientId: "da81Off",
            },
          ],
        } as EntryFragment,
      ],
    },
    // entry succeeded, entry failed
    ex9On: {
      experience: {} as ExperienceFragment,
      offlineEntries: [],
      newlyOnlineEntries: [
        {
          id: "en91On",
          clientId: "en91Off",
          dataObjects: [
            {
              clientId: "da91Off",
            },
          ],
        } as EntryFragment,
      ],
      entriesErrors: {
        en92Off: {} as any,
      },
    },
  };

  mockreadExperienceFragment
    .mockReturnValueOnce({
      id: "ex8On",
      entries: {
        edges: [
          {
            node: {
              id: "en81Off",
              clientId: "en81Off",
            },
          },
        ],
      },
    } as ExperienceFragment)
    .mockReturnValueOnce({
      id: "ex9On",
      entries: {
        edges: [
          {
            node: {
              id: "en91Off",
              clientId: "en91Off",
            },
          },
          {
            node: {
              id: "en92Off",
              clientId: "en92Off",
            },
          },
        ],
      },
    } as ExperienceFragment);

  const remainingOfflineCount = updateCache({
    completelyOfflineMap,
    partialOnlineMap,
    cache: null as any,
    client: null as any,
  });

  //134567
  expect(remainingOfflineCount).toBe(7);

  expect(mapMockReplaceExperiencesInGetExperiencesMiniQuery()).toEqual([
    ["ex1Off", "ex1On"],
    ["ex4Off", "ex4On"],
    ["ex5Off", "ex5On"],
  ]);

  expect(
    mockDecrementOfflineEntriesCountForExperiences.mock.calls[0][1],
  ).toEqual({
    ex1Off: 2,
    ex4Off: 2,
    ex5Off: 1,
    ex8On: 1,
    ex9On: 2,
  });

  expect(mapMockUpdateOfflineItemsLedger()).toEqual([
    ["ex1On", 1],
    ["ex2Off", 2],
    ["ex3Off", 1],
    ["ex6On", 1],
    ["ex7On", 1],
    ["ex8On", 0],
    ["ex9On", 1],
  ]);

  expect(mapMockWipeReferencesFromCache()).toEqual([
    makeApolloCacheRef(DATA_DEFINITION_TYPE_NAME, "def11Off"),
    makeApolloCacheRef(DATA_DEFINITION_TYPE_NAME, "def41Off"),
    makeApolloCacheRef(DATA_DEFINITION_TYPE_NAME, "def51Off"),
    makeApolloCacheRef(DATA_OBJECT_TYPE_NAME, "da12Off"),
    makeApolloCacheRef(DATA_OBJECT_TYPE_NAME, "da41Off"),
    makeApolloCacheRef(DATA_OBJECT_TYPE_NAME, "da81Off"),
    makeApolloCacheRef(DATA_OBJECT_TYPE_NAME, "da91Off"),
    makeApolloCacheRef(ENTRY_TYPE_NAME, "en12Off"),
    makeApolloCacheRef(ENTRY_TYPE_NAME, "en41Off"),
    makeApolloCacheRef(ENTRY_TYPE_NAME, "en81Off"),
    makeApolloCacheRef(ENTRY_TYPE_NAME, "en91Off"),
    makeApolloCacheRef(EXPERIENCE_TYPE_NAME, "ex1Off"),
    makeApolloCacheRef(EXPERIENCE_TYPE_NAME, "ex4Off"),
    makeApolloCacheRef(EXPERIENCE_TYPE_NAME, "ex5Off"),
  ]);

  expect(mapMockWriteExperienceFragmentToCache()).toEqual([
    "ex1On",
    "ex4On",
    "ex5On",
    "ex8On",
    "ex9On",
  ]);

  expect(mockRemoveQueriesAndMutationsFromCache).toHaveBeenCalled();
});

test("noop", () => {
  const remainingOfflineCount = updateCache({
    completelyOfflineMap: {} as any,
    partialOnlineMap: {} as any,
    cache: null as any,
    client: null as any,
  });

  expect(remainingOfflineCount).toBe(0);
});

function mapMockReplaceExperiencesInGetExperiencesMiniQuery() {
  return Object.entries(
    mockReplaceExperiencesInGetExperiencesMiniQuery.mock.calls[0][1] as any,
  ).map(([k, v]: any) => [k, v.id]);
}

function mapMockWipeReferencesFromCache() {
  return (mockWipeReferencesFromCache.mock.calls[0][1] as string[]).sort();
}

function mapMockUpdateOfflineItemsLedger() {
  return (mockUpdateOfflineItemsLedger.mock
    .calls[0][1] as any).map((v: any) => [v.id, v.offlineEntriesCount]);
}

function mapMockWriteExperienceFragmentToCache() {
  return mockWriteExperienceFragmentToCache.mock.calls.map(
    ([, arg]: any) => arg.id,
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { updateCache } from "../components/UploadUnsaved/update-cache";
import { ExperiencesIdsToObjectMap } from "../components/UploadUnsaved/utils";
import {
  ExperienceFragment,
  ExperienceFragment_entries_edges_node,
  ExperienceFragment_entries,
  ExperienceFragment_entries_edges,
} from "../graphql/apollo-types/ExperienceFragment";

jest.mock("../state/resolvers/update-get-experiences-mini-query");
jest.mock("../state/resolvers/write-get-experience-full-query-to-cache");
jest.mock("../state/resolvers/delete-references-from-cache");
jest.mock("../state/resolvers/write-experience-fragment-to-cache");
jest.mock("../state/resolvers/update-saved-and-unsaved-experiences-in-cache");

import { deleteIdsFromCache } from "../state/resolvers/delete-references-from-cache";
import { replaceExperiencesInGetExperiencesMiniQuery } from "../state/resolvers/update-get-experiences-mini-query";
import { writeGetExperienceFullQueryToCache } from "../state/resolvers/write-get-experience-full-query-to-cache";
import { writeSavedAndUnsavedExperiencesToCache } from "../state/resolvers/update-saved-and-unsaved-experiences-in-cache";
import { writeExperienceFragmentToCache } from "../state/resolvers/write-experience-fragment-to-cache";
import {
  MUTATION_NAME_createUnsavedEntry,
  MUTATION_NAME_createUnsavedExperience,
  QUERY_NAME_getExperience,
} from "../state/resolvers";
import { SAVED_AND_UNSAVED_EXPERIENCE_TYPENAME } from "../state/unsaved-resolvers";

const mockDeleteIdsFromCache = deleteIdsFromCache as jest.Mock;

const mockReplaceExperiencesInGetExperiencesMiniQuery = replaceExperiencesInGetExperiencesMiniQuery as jest.Mock;

const mockWriteGetExperienceFullQueryToCache = writeGetExperienceFullQueryToCache as jest.Mock;

const mockWriteSavedAndUnsavedExperiencesToCache = writeSavedAndUnsavedExperiencesToCache as jest.Mock;

const mockWriteExperienceFragmentToCache = writeExperienceFragmentToCache as jest.Mock;

test("", () => {
  const unsaved1 = {
    entries: {
      edges: [
        {
          node: {},
        },
      ] as ExperienceFragment_entries_edges[],
    } as ExperienceFragment_entries,
  } as ExperienceFragment;

  const arg1 = {
    "1": {
      // experience fully saved, will be deleted from cache
      experience: unsaved1,
      unsavedEntries: [],
      savedEntries: [],
      newlySavedEntries: [],
      newlySavedExperience: {
        entries: {
          edges: [] as ExperienceFragment_entries_edges[],
        },
      } as ExperienceFragment,
    },

    "2": {
      // experience partially saved, will be deleted from cache
      experience: {
        id: "21",
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
      unsavedEntries: [
        { id: "21" }, // did not save
        { id: "221" }, // saved, will be deleted from cache
      ] as ExperienceFragment_entries_edges_node[],
      entriesErrors: { "21": "1" },
      savedEntries: [], // an unsaved experience never has savedEntries
      newlySavedEntries: [
        { id: "22" } as ExperienceFragment_entries_edges_node,
      ],
      newlySavedExperience: {
        id: "2s",
        entries: {
          edges: [
            {
              node: {
                clientId: "221",
              },
            },
          ] as ExperienceFragment_entries_edges[],
        },
      } as ExperienceFragment,
    },

    "3": {
      // newlySavedExperience = undefined, outstanding unsaved count = 2
      experience: {
        id: "3",
      } as ExperienceFragment,
      // since experience did not save, ditto entry. outstanding unsaved
      // count = 3
      unsavedEntries: [{} as ExperienceFragment_entries_edges_node],
      entriesErrors: {},
      savedEntries: [],
      newlySavedEntries: [],
    },
  } as ExperiencesIdsToObjectMap;

  const arg2 = {
    "4": {
      experience: {
        id: "4",
      },
      // newlySavedEntries = undefined, outstanding unsaved count = 4
      unsavedEntries: [{}],
    } as any,

    "5": {
      experience: {
        id: "5",
      },
      unsavedEntries: [{}],
      // newlySavedEntries = [], outstanding unsaved count = 5
      newlySavedEntries: [],
    } as any,

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
      unsavedEntries: [],
      savedEntries: [],
      newlySavedEntries: [
        {
          id: "22s",
          clientId: "22-c",
        } as ExperienceFragment_entries_edges_node,
      ],
      // so we have one entry we are unable to save,
      // outstanding unsaved count = 6
      entriesErrors: { yy: "x" },
    },

    "7": {
      experience: {
        id: "7",
        entries: {
          edges: [] as ExperienceFragment_entries_edges[],
        },
      } as ExperienceFragment,
      unsavedEntries: [],
      savedEntries: [],
      newlySavedEntries: [
        { clientId: "71-c" },
      ] as ExperienceFragment_entries_edges_node[],
    },
  } as ExperiencesIdsToObjectMap;

  const outstandingUnsavedCount = updateCache({
    unsavedExperiencesMap: arg1,
    savedExperiencesMap: arg2,
    cache: {} as any,
    client: {} as any,
  });

  expect(mockWriteGetExperienceFullQueryToCache).toHaveBeenCalledTimes(2);

  expect(mockWriteExperienceFragmentToCache).toHaveBeenCalledTimes(2);

  expect(outstandingUnsavedCount).toBe(6);

  // the IDs that will be removed from cache
  // "1" - unsaved now completely saved experience
  // "2" - the unsaved now partially saved experience
  // "221" - client ID of experience "2"s entry that was successfully saved
  expect(mockDeleteIdsFromCache).toHaveBeenCalledWith(
    {},
    [
      "Experience:1",
      `${SAVED_AND_UNSAVED_EXPERIENCE_TYPENAME}:1`,
      "Experience:2",
      "Entry:221",
      "Entry:22-c",
      "Entry:71-c",
      `${SAVED_AND_UNSAVED_EXPERIENCE_TYPENAME}:7`,
    ],
    {
      mutations: [
        [MUTATION_NAME_createUnsavedExperience, "Experience:1"],
        [MUTATION_NAME_createUnsavedExperience, "Experience:2"],
        [MUTATION_NAME_createUnsavedEntry, "Entry:221"],
        [MUTATION_NAME_createUnsavedEntry, "Entry:22-c"],
        [MUTATION_NAME_createUnsavedEntry, "Entry:71-c"],
      ],

      queries: [
        [QUERY_NAME_getExperience, "Experience:1"],
        [QUERY_NAME_getExperience, "Experience:2"],
      ],
    },
  );

  expect(
    mockReplaceExperiencesInGetExperiencesMiniQuery.mock.calls[0][1],
  ).toEqual({
    "1": {
      entries: {
        edges: [],
      },
    },

    "2": {
      id: "2s",
      entries: {
        edges: [
          {
            node: {
              clientId: "221",
            },
          },

          {
            __typename: "EntryEdge",
            cursor: "",
            node: {
              id: "21",
            },
          },
        ],
      },
    },
  });

  expect(mockWriteSavedAndUnsavedExperiencesToCache.mock.calls[0][1]).toEqual([
    {
      id: "2s",
      unsavedEntriesCount: 1,
      __typename: "SavedAndUnsavedExperiences",
    },

    {
      id: "3",
      unsavedEntriesCount: 1,
      __typename: "SavedAndUnsavedExperiences",
    },

    {
      id: "4",
      unsavedEntriesCount: 1,
      __typename: "SavedAndUnsavedExperiences",
    },

    {
      id: "5",
      unsavedEntriesCount: 1,
      __typename: "SavedAndUnsavedExperiences",
    },

    {
      id: "6",
      unsavedEntriesCount: 1,
      __typename: "SavedAndUnsavedExperiences",
    },
  ]);
});

test("updating when there is nothing to update is a noop", () => {
  jest.resetAllMocks();

  const outstandingUnsavedCount = updateCache({
    unsavedExperiencesMap: {},
    savedExperiencesMap: {},
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

  expect(mockWriteExperienceFragmentToCache).not.toHaveBeenCalled();
});

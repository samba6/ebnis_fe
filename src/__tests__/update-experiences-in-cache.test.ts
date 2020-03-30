import { DataProxy } from "apollo-cache";
import { updateExperiencesInCache } from "../apollo-cache/update-experiences";
import { floatExperiencesToTheTopInGetExperiencesMiniQuery } from "../apollo-cache/update-get-experiences-mini-query";
import { readExperienceFragment } from "../apollo-cache/read-experience-fragment";
import { writeExperienceFragmentToCache } from "../apollo-cache/write-experience-fragment";
import { UpdateExperiencesOnlineMutationResult } from "../graphql/experiences.mutation";
import {
  getUnsyncedExperience,
  writeUnsyncedExperience,
  removeUnsyncedExperience,
  UnsyncedModifiedExperience,
} from "../apollo-cache/unsynced.resolvers";
import { DefinitionErrorsFragment } from "../graphql/apollo-types/DefinitionErrorsFragment";
import { DefinitionSuccessFragment } from "../graphql/apollo-types/DefinitionSuccessFragment";
import { UpdateExperienceSomeSuccessFragment } from "../graphql/apollo-types/UpdateExperienceSomeSuccessFragment";
import { ExperienceFragment } from "../graphql/apollo-types/ExperienceFragment";
import { EntryConnectionFragment_edges } from "../graphql/apollo-types/EntryConnectionFragment";
import { EntryFragment } from "../graphql/apollo-types/EntryFragment";

jest.mock("../apollo-cache/unsynced.resolvers");
const mockGetUnsyncedExperience = getUnsyncedExperience as jest.Mock;
const mockWriteUnsyncedExperience = writeUnsyncedExperience as jest.Mock;
const mockRemoveUnsyncedExperience = removeUnsyncedExperience as jest.Mock;

jest.mock("../apollo-cache/update-get-experiences-mini-query");
const mockFloatExperiencesToTheTopInGetExperiencesMiniQuery = floatExperiencesToTheTopInGetExperiencesMiniQuery as jest.Mock;

jest.mock("../apollo-cache/read-experience-fragment");
const mockReadExperienceFragment = readExperienceFragment as jest.Mock;

jest.mock("../apollo-cache/write-experience-fragment");
const mockWriteExperienceFragmentToCache = writeExperienceFragmentToCache as jest.Mock;

beforeEach(() => {
  jest.resetAllMocks();
});

const dataProxy = {} as DataProxy;

test("no updates", () => {
  updateExperiencesInCache()(dataProxy, {});
  expect(mockWriteExperienceFragmentToCache).not.toHaveBeenCalled();
});

test("all failed", () => {
  updateExperiencesInCache()(dataProxy, {
    data: {
      updateExperiences: {
        __typename: "UpdateExperiencesAllFail",
      },
    },
  } as UpdateExperiencesOnlineMutationResult);

  expect(
    mockFloatExperiencesToTheTopInGetExperiencesMiniQuery,
  ).not.toHaveBeenCalled();
});

test("some success", () => {
  const updateExperienceResult1 = {
    __typename: "UpdateExperienceSomeSuccess",
    experience: {},
  };

  const mockReadExperienceFragmentReturnValue1 = null;

  const updateExperienceResult2 = {
    __typename: "UpdateExperienceSomeSuccess",
    experience: {
      experienceId: "2",
    },
  } as UpdateExperienceSomeSuccessFragment;

  const mockReadExperienceFragmentReturnValue2 = {
    id: "2",
  };

  const updateExperienceResult3 = {
    __typename: "UpdateExperienceSomeSuccess",
    experience: {
      experienceId: "3",
      ownFields: {
        __typename: "UpdateExperienceOwnFieldsErrors",
      },
      updatedDefinitions: [
        {
          __typename: "DefinitionErrors",
        },
      ],
      newEntries: [
        {
          __typename: "CreateEntryErrors",
        },
      ],
      updatedEntries: [
        {
          __typename: "UpdateEntryErrors",
        },
      ],
    },
  } as UpdateExperienceSomeSuccessFragment;

  const mockReadExperienceFragmentReturnValue3 = {
    id: "3",
    entries: {
      edges: [],
    },
  };

  const mockGetUnsyncedExperienceReturnValue3 = {};

  const updateExperienceResult4 = {
    __typename: "UpdateExperienceSomeSuccess",
    experience: {
      experienceId: "4",
      ownFields: {
        __typename: "ExperienceOwnFieldsSuccess",
        data: {},
      },
      updatedDefinitions: [
        {
          __typename: "DefinitionSuccess",
          definition: {
            id: "4dd1",
          },
        },
      ] as DefinitionSuccessFragment[],
      newEntries: [
        {
          __typename: "CreateEntrySuccess",
          entry: {
            // offline entry synced
            clientId: "4enc1",
            id: "4enc1",
          },
        },
      ],
    },
  } as UpdateExperienceSomeSuccessFragment; // 4

  const mockReadExperienceFragmentReturnValue4 = {
    id: "4",
    dataDefinitions: [
      {
        id: "4dd1",
      },
      {
        id: "4dd2",
      },
    ],
    entries: {
      edges: [
        {
          // offline entry synced
          node: {
            id: "4enc1",
          },
        },
      ],
    },
  } as ExperienceFragment;

  const mockGetUnsyncedExperienceReturnValue4 = {
    definitions: {},
    modifiedEntries: {},
  };

  const updateExperienceResult5 = {
    __typename: "UpdateExperienceSomeSuccess",
    experience: {
      experienceId: "5",
      updatedDefinitions: [
        {
          __typename: "DefinitionErrors",
        },
        {
          __typename: "DefinitionSuccess",
          definition: {
            id: "4dd1",
          },
        },
      ] as DefinitionErrorsFragment[],
      newEntries: [
        {
          __typename: "CreateEntryErrors",
        },
        {
          __typename: "CreateEntrySuccess",
          entry: {
            clientId: "4enc2",
            id: "4enc2",
          },
        },
      ],
    },
  } as UpdateExperienceSomeSuccessFragment;

  const mockReadExperienceFragmentReturnValue5 = {
    id: "4",
    dataDefinitions: [
      {
        id: "4dd1",
      },
    ],
    entries: {
      edges: [
        {
          // updated
          node: {
            id: "4enc1",
            dataObjects: [
              {
                id: "4do1",
              },
              {
                id: "4do2",
              },
            ],
          },
        },
      ],
    },
  } as ExperienceFragment;

  const mockGetUnsyncedExperienceReturnValue5 = {
    definitions: {
      "4dd1": { name: true },
    },
    newEntries: true,
    modifiedEntries: {
      "4enc1": {},
    },
  } as UnsyncedModifiedExperience;

  mockReadExperienceFragment
    .mockReturnValueOnce(mockReadExperienceFragmentReturnValue1)
    .mockReturnValueOnce(mockReadExperienceFragmentReturnValue2)
    .mockReturnValueOnce(mockReadExperienceFragmentReturnValue3)
    .mockReturnValueOnce(mockReadExperienceFragmentReturnValue4)
    .mockReturnValueOnce(mockReadExperienceFragmentReturnValue5);

  mockGetUnsyncedExperience
    .mockReturnValueOnce(mockGetUnsyncedExperienceReturnValue3)
    .mockReturnValueOnce(mockGetUnsyncedExperienceReturnValue4)
    .mockReturnValueOnce(mockGetUnsyncedExperienceReturnValue5);

  const mockOnDone = jest.fn();

  updateExperiencesInCache(mockOnDone)(dataProxy, {
    data: {
      updateExperiences: {
        __typename: "UpdateExperiencesSomeSuccess",
        experiences: [
          {
            __typename: "UpdateExperienceErrors",
          },
          updateExperienceResult1,
          updateExperienceResult2,
          updateExperienceResult3,
          updateExperienceResult4,
          updateExperienceResult5,
        ],
      },
    },
  } as UpdateExperiencesOnlineMutationResult);

  expect(
    Object.keys(
      mockFloatExperiencesToTheTopInGetExperiencesMiniQuery.mock.calls[0][1],
    ),
  ).toEqual(["1", "2", "3", "4"]);

  expect(
    mockWriteExperienceFragmentToCache.mock.calls.reduce((acc, [, t]) => {
      const { id } = t;
      const entriesId = (t.entries || { edges: [] }).edges.map(
        (e: EntryConnectionFragment_edges) => {
          return (e.node as EntryFragment).id;
        },
      );

      acc[id] = {
        hasUnsaved: t.hasUnsaved,
        entriesId,
      };
      return acc;
    }, {}),
  ).toEqual({
    "1": {
      hasUnsaved: null,
      entriesId: [],
    },
    "2": {
      hasUnsaved: undefined,
      entriesId: [],
    },
    "3": {
      hasUnsaved: null,
      entriesId: ["3enc1", "3enc2"],
    },
    "4": {
      hasUnsaved: undefined,
      entriesId: ["4enc2", "4enc1"],
    },
  });

  expect(mockWriteUnsyncedExperience.mock.calls[0]).toEqual([
    "4",
    mockGetUnsyncedExperienceReturnValue5,
  ]);

  expect(mockRemoveUnsyncedExperience.mock.calls.map(x => x[0])).toEqual([
    "2",
    "3",
  ]);

  expect(mockOnDone).toHaveBeenCalled();
});

test.only("updated entries", () => {
  const updatedExperience1 = {
    __typename: "UpdateExperienceSomeSuccess",
    experience: {
      experienceId: "1",
      updatedEntries: [
        {
          __typename: "UpdateEntrySomeSuccess",
          entry: {
            entryId: "en11",
            dataObjects: [
              {
                __typename: "DataObjectSuccess",
                dataObject: {
                  id: "do11",
                },
              },
            ],
          },
        },
      ],
    },
  } as UpdateExperienceSomeSuccessFragment;

  const mockGetUnsyncedExperienceReturnValue1 = {
    modifiedEntries: {},
  } as UnsyncedModifiedExperience;

  const mockReadExperienceFragmentReturnValue1 = {
    id: "1",
    entries: {
      edges: [
        {
          // updated
          node: {
            id: "en21",
            dataObjects: [
              {
                // updated
                id: "do21",
              },
              {
                // not updated
                id: "do22",
              },
            ],
          },
        },
        {
          // not updated
          node: {
            id: "en22",
          },
        },
      ],
    },
  } as ExperienceFragment;

  const updatedExperience2 = {
    __typename: "UpdateExperienceSomeSuccess",
    experience: {
      experienceId: "2",
      updatedEntries: [
        {
          __typename: "UpdateEntryErrors",
        },
        {
          __typename: "UpdateEntrySomeSuccess",
          entry: {
            entryId: "en21",
            dataObjects: [
              {
                __typename: "DataObjectErrors",
              },
              {
                __typename: "DataObjectSuccess",
                dataObject: {
                  id: "do21",
                },
              },
            ],
          },
        },
      ],
    },
  } as UpdateExperienceSomeSuccessFragment;

  const mockGetUnsyncedExperienceReturnValue2 = {
    modifiedEntries: {
      en21: {
        do21: true,
        do22: true,
      },
    },
  } as UnsyncedModifiedExperience;

  const mockReadExperienceFragmentReturnValue2 = {
    id: "1",
    entries: {
      edges: [
        {
          // updated
          node: {
            id: "en21",
            dataObjects: [
              {
                // updated
                id: "do21",
              },
              {
                // not updated
                id: "do22",
              },
            ],
          },
        },
        {
          // not updated
          node: {
            id: "en22",
          },
        },
      ],
    },
  } as ExperienceFragment;

  const updatedExperience3 = {
    __typename: "UpdateExperienceSomeSuccess",
    experience: {
      experienceId: "3",
      updatedEntries: [
        {
          __typename: "UpdateEntryErrors",
        },
        {
          __typename: "UpdateEntrySomeSuccess",
          entry: {
            entryId: "en31",
            dataObjects: [
              {
                __typename: "DataObjectSuccess",
                dataObject: {
                  id: "do31",
                },
              },
            ],
          },
        },
      ],
    },
  } as UpdateExperienceSomeSuccessFragment;

  const mockGetUnsyncedExperienceReturnValue3 = {
    modifiedEntries: {
      en31: {},
    },
  } as UnsyncedModifiedExperience;

  const mockReadExperienceFragmentReturnValue3 = {
    id: "3",
    entries: {
      edges: [
        {
          node: {
            id: "en31",
            dataObjects: [{}],
          },
        },
      ],
    },
  } as ExperienceFragment;

  mockGetUnsyncedExperience
    .mockReturnValueOnce(mockGetUnsyncedExperienceReturnValue1)
    .mockReturnValueOnce(mockGetUnsyncedExperienceReturnValue2)
    .mockReturnValueOnce(mockGetUnsyncedExperienceReturnValue3);

  mockReadExperienceFragment
    .mockReturnValueOnce(mockReadExperienceFragmentReturnValue1)
    .mockReturnValueOnce(mockReadExperienceFragmentReturnValue2)
    .mockReturnValueOnce(mockReadExperienceFragmentReturnValue3);

  updateExperiencesInCache()(dataProxy, {
    data: {
      updateExperiences: {
        __typename: "UpdateExperiencesSomeSuccess",
        experiences: [
          updatedExperience1,
          updatedExperience2,
          updatedExperience3,
        ],
      },
    },
  } as UpdateExperiencesOnlineMutationResult);

  expect(
    mockFloatExperiencesToTheTopInGetExperiencesMiniQuery.mock.calls[0][1],
  ).toEqual({
    "1": 1,
    "2": 1,
    "3": 1,
  });

  expect(mockRemoveUnsyncedExperience.mock.calls).toEqual([["1"]]);
  expect(mockWriteUnsyncedExperience.mock.calls).toEqual([
    [
      "2",
      {
        modifiedEntries: {
          en21: {
            do22: true,
          },
        },
      },
    ],
    [
      "3",
      {
        modifiedEntries: {},
      },
    ],
  ]);
});

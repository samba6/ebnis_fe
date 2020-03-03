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
  mockReadExperienceFragment
    .mockReturnValueOnce(null) // 1
    .mockReturnValueOnce({
      id: "1",
    }) // 2
    .mockReturnValueOnce({
      id: "2",
      entries: {
        edges: [],
      },
    }) // 3
    .mockReturnValueOnce({
      id: "3",
      dataDefinitions: [
        {
          id: "3dd1",
        },
        {
          id: "3dd2",
        },
      ],
      entries: {
        edges: [
          {
            node: {
              id: "3enc1",
            },
          },
          {
            node: {
              id: "3enc2",
            },
          },
        ],
      },
    } as ExperienceFragment) // 4
    .mockReturnValueOnce({
      id: "4",
      dataDefinitions: [
        {
          id: "4dd1",
        },
      ],
      entries: {
        edges: [
          {
            node: {
              id: "4enc1",
            },
          },
        ],
      },
    } as ExperienceFragment); // 5

  const unsynced5 = {
    definitions: {
      "4enc1": { name: true },
    },
    newEntries: true,
  } as UnsyncedModifiedExperience;

  mockGetUnsyncedExperience
    .mockReturnValueOnce(null) // 2
    .mockReturnValueOnce({}) // 3
    .mockReturnValueOnce({ definitions: {} }) // 4
    .mockReturnValueOnce(unsynced5); // 5

  const mockOnDone = jest.fn();

  updateExperiencesInCache(mockOnDone)(dataProxy, {
    data: {
      updateExperiences: {
        __typename: "UpdateExperiencesSomeSuccess",
        experiences: [
          {
            __typename: "UpdateExperienceErrors",
          },
          {
            __typename: "UpdateExperienceSomeSuccess", // 1
            experience: {},
          },
          {
            __typename: "UpdateExperienceSomeSuccess", // 2
            experience: {
              experienceId: "1",
            },
          } as UpdateExperienceSomeSuccessFragment,
          {
            __typename: "UpdateExperienceSomeSuccess", // 3
            experience: {
              experienceId: "2",
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
            },
          } as UpdateExperienceSomeSuccessFragment,
          {
            // 4
            __typename: "UpdateExperienceSomeSuccess",
            experience: {
              experienceId: "3",
              ownFields: {
                __typename: "ExperienceOwnFieldsSuccess",
                data: {},
              },
              updatedDefinitions: [
                {
                  __typename: "DefinitionSuccess",
                  definition: {
                    id: "3dd1",
                  },
                },
              ] as DefinitionSuccessFragment[],
              newEntries: [
                {
                  __typename: "CreateEntrySuccess",
                  entry: {
                    clientId: "3enc1",
                  },
                },
              ],
            },
          } as UpdateExperienceSomeSuccessFragment, // 4
          {
            // 5
            __typename: "UpdateExperienceSomeSuccess",
            experience: {
              experienceId: "4",
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
                  },
                },
              ],
            },
          } as UpdateExperienceSomeSuccessFragment, // 5
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
      acc[t.id] = {
        hasUnsaved: t.hasUnsaved,
      };
      return acc;
    }, {}),
  ).toEqual({
    "1": {
      hasUnsaved: null,
    },
    "2": {
      hasUnsaved: undefined,
    },
    "3": {
      hasUnsaved: null,
    },
    "4": {
      hasUnsaved: undefined,
    },
  });

  expect(mockWriteUnsyncedExperience.mock.calls[0]).toEqual(["4", unsynced5]);

  expect(mockRemoveUnsyncedExperience.mock.calls.map(x => x[0])).toEqual([
    "2",
    "3",
  ]);

  expect(mockOnDone).toHaveBeenCalled();
});

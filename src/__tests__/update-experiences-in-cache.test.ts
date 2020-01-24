import { DataProxy } from "apollo-cache";
import { updateExperiencesInCache } from "../apollo-cache/update-experiences";
import { floatExperiencesToTheTopInGetExperiencesMiniQuery } from "../apollo-cache/update-get-experiences-mini-query";
import { readExperienceFragment } from "../apollo-cache/read-experience-fragment";
import { writeExperienceFragmentToCache } from "../apollo-cache/write-experience-fragment";
import { UpdateExperiencesOnlineMutationResult } from "../graphql/update-experience.mutation";

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
  updateExperiencesInCache(dataProxy, {});
  expect(mockWriteExperienceFragmentToCache).not.toHaveBeenCalled();
});

test("all failed", () => {
  updateExperiencesInCache(dataProxy, {
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
    .mockReturnValueOnce(null)
    .mockReturnValueOnce({
      id: "1",
    })
    .mockReturnValueOnce({
      id: "2",
    })
    .mockReturnValueOnce({
      id: "3",
      dataDefinitions: [
        {
          id: "1",
        },
        {
          id: "2",
        },
      ],
    });

  updateExperiencesInCache(dataProxy, {
    data: {
      updateExperiences: {
        __typename: "UpdateExperiencesSomeSuccess",
        experiences: [
          {
            __typename: "UpdateExperienceFullErrors",
          },
          {
            __typename: "UpdateExperienceSomeSuccess",
            experience: {},
          },
          {
            __typename: "UpdateExperienceSomeSuccess",
            experience: {
              experienceId: "1",
            },
          },
          {
            __typename: "UpdateExperienceSomeSuccess",
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
            },
          },
          {
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
                    id: "1",
                  },
                },
              ],
            },
          },
        ],
      },
    },
  } as UpdateExperiencesOnlineMutationResult);

  expect(
    Object.keys(
      mockFloatExperiencesToTheTopInGetExperiencesMiniQuery.mock.calls[0][1],
    ),
  ).toEqual(["1", "2", "3"]);

  expect(
    mockWriteExperienceFragmentToCache.mock.calls.map(([, t]) => t.id),
  ).toEqual(["1", "2", "3"]);
});

/* eslint-disable @typescript-eslint/no-explicit-any */
import { DataProxy } from "apollo-cache";
import {
  deleteExperiencesFromCache,
  GET_EXPERIENCES_MINI_ROOT_QUERY_KEY_PREFIX,
  getOpsData,
} from "../apollo-cache/delete-experiences-from-cache";
import { AppPersistor } from "../context";
import {
  wipeReferencesFromCache,
  removeQueriesAndMutationsFromCache,
} from "../state/resolvers/delete-references-from-cache";
import { removeUnsyncedExperiences } from "../apollo-cache/unsynced.resolvers";
import { getExperiencesMiniQuery } from "../apollo-cache/get-experiences-mini-query";
import { ExperienceConnectionFragment } from "../graphql/apollo-types/ExperienceConnectionFragment";
import { GetExperienceConnectionMini_getExperiences } from "../graphql/apollo-types/GetExperienceConnectionMini";

jest.mock("../apollo-cache/get-experiences-mini-query");
const mockGetExperiencesMiniQuery = getExperiencesMiniQuery as jest.Mock;

jest.mock("../state/resolvers/delete-references-from-cache");
const mockWipeReferencesFromCache = wipeReferencesFromCache as jest.Mock;
const mockRemoveQueriesAndMutationsFromCache = removeQueriesAndMutationsFromCache as jest.Mock;

jest.mock("../apollo-cache/unsynced.resolvers");
const mockRemoveUnsyncedExperiences = removeUnsyncedExperiences as jest.Mock;

const mockWriteQuery = jest.fn();
const dataProxy = {
  writeQuery: mockWriteQuery as any,
} as DataProxy;

const mockPersistFn = jest.fn();
const persistor = {
  persist: mockPersistFn as any,
} as AppPersistor;

afterEach(() => {
  jest.resetAllMocks();
});

describe("unit test", () => {
  test("nothing to remove", () => {
    const received = getOpsData([], {
      edges: [] as any,
    } as GetExperienceConnectionMini_getExperiences);

    expect(received).toBeNull();
  });

  test("getOpsData: all removed, nothing to write", () => {
    const ids: string[] = [
      "1", // found
      "2", // not found
    ];

    const experiencesConnection = {
      edges: [
        {
          node: {
            id: "1",
          },
        },
      ],
    } as GetExperienceConnectionMini_getExperiences;

    const received = getOpsData(ids, experiencesConnection);

    const expected = [
      [], // edges to write
      ["1"],
      ["1"],
      [],
    ];

    expect(received).toEqual(expected);
  });

  test("getOpsData: not all removed, something to write", () => {
    const ids: string[] = [
      // found
      "2",
      "3",
    ];

    const edges = Array.from({ length: 4 }, (a, index) => {
      return {
        node: {
          id: "" + (index + 1),
        },
      };
    });

    const experiencesConnection = {
      edges,
    } as GetExperienceConnectionMini_getExperiences;

    const received = getOpsData(ids, experiencesConnection);

    const newEdges = [...edges];
    newEdges.splice(1, 2); // remove 2 and 3

    const expected = [
      // expected
      newEdges,
      ["2", "3"],
      ["2", "3"],
      [2, 3].map(index => {
        return `${GET_EXPERIENCES_MINI_ROOT_QUERY_KEY_PREFIX}${index}`;
      }),
    ];

    expect(received).toEqual(expected);
  });
});

describe("integration", () => {
  test("no experiences mini query in cache", async () => {
    const ids: string[] = [];
    mockGetExperiencesMiniQuery.mockReturnValue(null);

    await deleteExperiencesFromCache(dataProxy, persistor, ids);

    expect(mockWriteQuery).not.toHaveBeenCalled();
    expect(mockWipeReferencesFromCache).not.toHaveBeenCalled();
    expect(mockRemoveQueriesAndMutationsFromCache).not.toHaveBeenCalled();
    expect(mockRemoveUnsyncedExperiences).not.toHaveBeenCalled();
  });

  test("experiences mini query found in cache: modified", async () => {
    const ids: string[] = [
      "1", // not found in cache
      "2", // found deleted
    ];

    mockGetExperiencesMiniQuery.mockReturnValue({
      edges: [
        {
          node: {
            id: "2",
          },
        },
        {
          node: {
            id: "3",
          },
        },
      ],
    } as ExperienceConnectionFragment);

    await deleteExperiencesFromCache(dataProxy, persistor, ids);

    expect(mockWriteQuery.mock.calls[0][0].data.getExperiences).toEqual({
      edges: [
        {
          node: {
            id: "3",
          },
        },
      ],
    });

    expect(mockWipeReferencesFromCache.mock.calls[0][1]).toEqual([
      "2",
      `${GET_EXPERIENCES_MINI_ROOT_QUERY_KEY_PREFIX}1`,
    ]);

    expect(mockRemoveQueriesAndMutationsFromCache).not.toHaveBeenCalled();
    expect(mockRemoveUnsyncedExperiences.mock.calls[0][0]).toEqual(["2"]);
  });

  test("experiences mini query found in cache: deleted", async () => {
    const ids: string[] = [
      "2", // found deleted
    ];

    mockGetExperiencesMiniQuery.mockReturnValue({
      edges: [
        {
          node: {
            id: "2",
          },
        },
      ],
    } as ExperienceConnectionFragment);

    await deleteExperiencesFromCache(dataProxy, persistor, ids);

    expect(mockWriteQuery).not.toHaveBeenCalled();

    expect(mockWipeReferencesFromCache.mock.calls[0][1]).toEqual(["2"]);

    expect(mockRemoveQueriesAndMutationsFromCache).toHaveBeenCalled();
    expect(mockRemoveUnsyncedExperiences.mock.calls[0][0]).toEqual(["2"]);
  });
});

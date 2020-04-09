/* eslint-disable @typescript-eslint/no-explicit-any */
import { DataProxy } from "apollo-cache";
import {
  deleteExperiencesFromCache,
  GET_EXPERIENCES_MINI_ROOT_QUERY_KEY_PREFIX,
  getOpsData,
  GetOpsReturn,
  getDescendantId,
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
import { makeOfflineId } from "../constants";
import { readExperienceFragment } from "../apollo-cache/read-experience-fragment";
import { ExperienceFragment } from "../graphql/apollo-types/ExperienceFragment";

jest.mock("../apollo-cache/read-experience-fragment");
const mockReadExperienceFragment = readExperienceFragment as jest.Mock;

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

const dd = {
  dataDefinitions: [
    {
      id: "3",
    },
  ],
  entries: {
    edges: [
      {
        node: {
          id: "4",
          dataObjects: [
            {
              id: "5",
            },
          ],
        },
      },
    ],
  },
} as ExperienceFragment;
describe("unit test", () => {
  test("nothing to remove", () => {
    const received = getOpsData([], {
      edges: [] as any,
    } as GetExperienceConnectionMini_getExperiences);

    expect(received).toBeNull();
  });

  test("all removed, nothing to write", () => {
    const id1 = makeOfflineId(1);

    const ids: string[] = [
      id1, // found
      "2", // not found
      "3", // found
    ];

    const experiencesConnection = {
      edges: [
        {
          node: {
            id: id1,
          },
        },
        {
          node: {
            id: "3",
          },
        },
      ],
    } as GetExperienceConnectionMini_getExperiences;

    const received = getOpsData(ids, experiencesConnection);

    const expected: GetOpsReturn = [
      [], // edges to write
      [id1],
      ["3"],
      [id1, "3"],
      [],
    ];

    expect(received).toEqual(expected);
  });

  test("not all removed, something to write", () => {
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
      [],
      ["2", "3"],
      ["2", "3"],
      [2, 3].map(index => {
        return `${GET_EXPERIENCES_MINI_ROOT_QUERY_KEY_PREFIX}${index}`;
      }),
    ];

    expect(received).toEqual(expected);
  });

  test("get descendants", () => {
    const received = getDescendantId(dd);
    expect(received).toEqual(["3", "4", "5"]);
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

  test("experiences mini query found in cache: query modified", async () => {
    const id = makeOfflineId("2");

    const ids: string[] = [id];

    mockGetExperiencesMiniQuery.mockReturnValue({
      edges: [
        {
          node: {
            id,
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
      id,
      `${GET_EXPERIENCES_MINI_ROOT_QUERY_KEY_PREFIX}1`,
    ]);

    expect(mockRemoveQueriesAndMutationsFromCache).not.toHaveBeenCalled();
    expect(mockRemoveUnsyncedExperiences.mock.calls[0][0]).toEqual([id]);
  });

  test("experiences mini query found in cache: query deleted", async () => {
    const id1 = "1";
    const experience1 = null;

    const id2 = "2";
    const experience2 = {
      id: id2,
      ...dd,
    } as ExperienceFragment;

    mockGetExperiencesMiniQuery.mockReturnValue({
      edges: [
        {
          node: {
            id: id1,
          },
        },
        {
          node: {
            id: id2,
          },
        },
      ],
    } as ExperienceConnectionFragment);

    mockReadExperienceFragment
      .mockReturnValueOnce(experience1)
      .mockReturnValueOnce(experience2);

    await deleteExperiencesFromCache(dataProxy, persistor, [id1, id2]);

    expect(mockWriteQuery).not.toHaveBeenCalled();

    expect(mockWipeReferencesFromCache.mock.calls[0][1]).toEqual([
      id1,
      id2,
      "3",
      "4",
      "5",
    ]);

    expect(mockRemoveQueriesAndMutationsFromCache).toHaveBeenCalled();
    expect(mockRemoveUnsyncedExperiences.mock.calls[0][0]).toEqual([id1, id2]);
  });
});

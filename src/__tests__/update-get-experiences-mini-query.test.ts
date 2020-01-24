/* eslint-disable @typescript-eslint/no-explicit-any*/
import { DataProxy } from "apollo-cache";
import {
  insertExperienceInGetExperiencesMiniQuery,
  floatExperienceToTheTopInGetExperiencesMiniQuery,
  replaceExperiencesInGetExperiencesMiniQuery,
  floatExperiencesToTheTopInGetExperiencesMiniQuery,
} from "../apollo-cache/update-get-experiences-mini-query";
import { getExperiencesMiniQuery } from "../apollo-cache/get-experiences-mini-query";
import { ExperienceFragment } from "../graphql/apollo-types/ExperienceFragment";

jest.mock("../apollo-cache/get-experiences-mini-query", () => ({
  getExperiencesMiniQuery: jest.fn(),
  readQuery: {},
}));
const mockGetExperiencesMiniQuery = getExperiencesMiniQuery as jest.Mock;

const mockWriteQuery = jest.fn();

beforeEach(() => {
  jest.resetAllMocks();
});

const dataProxy = {
  writeQuery: mockWriteQuery as any,
} as DataProxy;

describe("insertExperienceInGetExperiencesMiniQuery", () => {
  test("no experiences and not forcing", async () => {
    await insertExperienceInGetExperiencesMiniQuery(
      dataProxy,
      {} as ExperienceFragment,
    );

    expect(mockWriteQuery).not.toHaveBeenCalled();
  });

  test("no experiences but forcing", async () => {
    await insertExperienceInGetExperiencesMiniQuery(
      dataProxy,
      { id: "a" } as ExperienceFragment,
      { force: true },
    );

    const mockWriteQueryArg = mockWriteQuery.mock.calls[0][0];
    expect(mockWriteQueryArg.data.getExperiences.edges[0].node.id).toBe("a");
  });

  test("no experience edges", async () => {
    mockGetExperiencesMiniQuery.mockReturnValue({});

    await insertExperienceInGetExperiencesMiniQuery(
      dataProxy,
      { id: "a" } as ExperienceFragment,
      { force: true },
    );

    const mockWriteQueryArg = mockWriteQuery.mock.calls[0][0];
    expect(mockWriteQueryArg.data.getExperiences.edges[0].node.id).toBe("a");
  });

  test("insert as first element", async () => {
    mockGetExperiencesMiniQuery.mockReturnValue({
      edges: [{ node: { id: "b" } }],
    });

    await insertExperienceInGetExperiencesMiniQuery(
      dataProxy,
      { id: "a" } as ExperienceFragment,
      { force: true },
    );

    const mockWriteQueryArg = mockWriteQuery.mock.calls[0][0];
    expect(
      mockWriteQueryArg.data.getExperiences.edges.map((e: any) => e.node.id),
    ).toEqual(["a", "b"]);
  });
});

describe("floatExperienceToTheTopInGetExperiencesMiniQuery", () => {
  test("no experiences", async () => {
    await floatExperienceToTheTopInGetExperiencesMiniQuery(dataProxy, {
      id: "a",
    } as ExperienceFragment);

    const mockWriteQueryArg = mockWriteQuery.mock.calls[0][0];
    expect(mockWriteQueryArg.data.getExperiences.edges[0].node.id).toBe("a");
  });

  test("no edges", async () => {
    mockGetExperiencesMiniQuery.mockReturnValue({});

    await floatExperienceToTheTopInGetExperiencesMiniQuery(dataProxy, {
      id: "a",
    } as ExperienceFragment);

    const mockWriteQueryArg = mockWriteQuery.mock.calls[0][0];
    expect(mockWriteQueryArg.data.getExperiences.edges[0].node.id).toBe("a");
  });

  test("floats to top of list", async () => {
    mockGetExperiencesMiniQuery.mockReturnValue({
      edges: [{ node: { id: "b" } }, { node: { id: "a" } }],
    });

    await floatExperienceToTheTopInGetExperiencesMiniQuery(dataProxy, {
      id: "a",
    } as ExperienceFragment);

    const mockWriteQueryArg = mockWriteQuery.mock.calls[0][0];
    expect(
      mockWriteQueryArg.data.getExperiences.edges.map((e: any) => e.node.id),
    ).toEqual(["a", "b"]);
  });
});

describe("replaceExperiencesInGetExperiencesMiniQuery", () => {
  test("no experiences", async () => {
    await replaceExperiencesInGetExperiencesMiniQuery(dataProxy as any, {});

    const mockWriteQueryArg = mockWriteQuery.mock.calls[0][0];

    expect(mockWriteQueryArg.data.getExperiences.edges).toEqual([]);
  });

  test("no edges", async () => {
    mockGetExperiencesMiniQuery.mockReturnValue({});

    await replaceExperiencesInGetExperiencesMiniQuery(dataProxy as any, {});

    const mockWriteQueryArg = mockWriteQuery.mock.calls[0][0];

    expect(mockWriteQueryArg.data.getExperiences.edges).toEqual([]);
  });

  test("replaces and removes", async () => {
    mockGetExperiencesMiniQuery.mockReturnValue({
      edges: [
        { node: { id: "a" } }, // leave alone
        { node: { id: "b" } }, // remove
        { node: { id: "c", title: "c" } }, // replace
      ],
    });

    await replaceExperiencesInGetExperiencesMiniQuery(dataProxy as any, {
      b: null,
      c: { id: "c", title: "cc" } as ExperienceFragment,
    });

    const mockWriteQueryArg = mockWriteQuery.mock.calls[0][0];

    expect(mockWriteQueryArg.data.getExperiences.edges).toEqual([
      { node: { id: "a" } },
      { node: { id: "c", title: "cc" } },
    ]);
  });
});

describe("floatExperiencesToTheTopInGetExperiencesMiniQuery", () => {
  test("no updates", () => {
    mockGetExperiencesMiniQuery
      .mockReturnValueOnce(null)
      .mockReturnValueOnce({});

    floatExperiencesToTheTopInGetExperiencesMiniQuery(dataProxy, {});
    expect(mockWriteQuery).not.toHaveBeenCalled();

    floatExperiencesToTheTopInGetExperiencesMiniQuery(dataProxy, {});
    expect(mockWriteQuery.mock.calls[0][0].data.getExperiences).toEqual({
      edges: [],
    });
  });

  test("updates", () => {
    mockGetExperiencesMiniQuery.mockReturnValue({
      edges: [
        {
          node: {
            id: "1",
          },
        },
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
    });

    floatExperiencesToTheTopInGetExperiencesMiniQuery(dataProxy, { "2": 1 });

    expect(mockWriteQuery.mock.calls[0][0].data.getExperiences).toEqual({
      edges: [
        {
          node: {
            id: "2",
          },
        },
        {
          node: {
            id: "1",
          },
        },
        {
          node: {
            id: "3",
          },
        },
      ],
    });
  });
});

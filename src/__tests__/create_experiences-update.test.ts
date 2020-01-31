import { DataProxy } from "apollo-cache";
import { createExperiencesManualUpdate } from "../apollo-cache/create_experiences-update";
import { CreateExperiencesMutationResult } from "../graphql/update-experience.mutation";
import { insertExperiencesInGetExperiencesMiniQuery } from "../apollo-cache/update-get-experiences-mini-query";
import { readExperienceFragment } from "../apollo-cache/read-experience-fragment";
import { writeExperienceFragmentToCache } from "../apollo-cache/write-experience-fragment";
import { ExperienceFragment } from "../graphql/apollo-types/ExperienceFragment";

jest.mock("../apollo-cache/read-experience-fragment");
const mockReadExperienceFragment = readExperienceFragment as jest.Mock;

jest.mock("../apollo-cache/write-experience-fragment");
const mockWriteExperienceFragmentToCache = writeExperienceFragmentToCache as jest.Mock;

jest.mock("../apollo-cache/update-get-experiences-mini-query");
const mockInsertExperiencesInGetExperiencesMiniQuery = insertExperiencesInGetExperiencesMiniQuery as jest.Mock;

const dataProxy = {} as DataProxy;

beforeEach(() => {
  jest.resetAllMocks();
});

test("invalid response", () => {
  createExperiencesManualUpdate(dataProxy, {});
  expect(mockInsertExperiencesInGetExperiencesMiniQuery).not.toHaveBeenCalled();
});

test("null response", () => {
  createExperiencesManualUpdate(dataProxy, {
    data: {
      createExperiences: [null],
    },
  });

  expect(mockInsertExperiencesInGetExperiencesMiniQuery).not.toHaveBeenCalled();
});

test("no success response", () => {
  createExperiencesManualUpdate(dataProxy, {
    data: {
      createExperiences: [
        {
          __typename: "CreateExperienceErrorss",
        },
      ],
    },
  } as CreateExperiencesMutationResult);

  expect(mockInsertExperiencesInGetExperiencesMiniQuery).not.toHaveBeenCalled();
});

test("no entries errors", () => {
  createExperiencesManualUpdate(dataProxy, {
    data: {
      createExperiences: [
        {
          __typename: "ExperienceSuccess",
          experience: {
            id: "1",
          },
        },
      ],
    },
  } as CreateExperiencesMutationResult);

  expect(
    mockInsertExperiencesInGetExperiencesMiniQuery.mock.calls[0][1],
  ).toEqual([{ id: "1" }]);
});

test("no cached experience", () => {
  mockReadExperienceFragment.mockReturnValue(null);

  createExperiencesManualUpdate(dataProxy, {
    data: {
      createExperiences: [
        {
          __typename: "ExperienceSuccess",
          experience: {
            id: "1",
          } as ExperienceFragment,
          entriesErrors: [],
        },
      ],
    },
  } as CreateExperiencesMutationResult);

  expect(
    mockInsertExperiencesInGetExperiencesMiniQuery.mock.calls[0][1],
  ).toEqual([{ id: "1" }]);
});

test("no unsynced edges", () => {
  mockReadExperienceFragment.mockReturnValue({
    entries: {},
  });

  createExperiencesManualUpdate(dataProxy, {
    data: {
      createExperiences: [
        {
          __typename: "ExperienceSuccess",
          experience: {
            id: "1",
          } as ExperienceFragment,
          entriesErrors: [],
        },
      ],
    },
  } as CreateExperiencesMutationResult);

  expect(
    mockInsertExperiencesInGetExperiencesMiniQuery.mock.calls[0][1],
  ).toEqual([{ id: "1" }]);

  expect(mockWriteExperienceFragmentToCache).not.toHaveBeenCalled();
});

test("no synced entries", () => {
  mockReadExperienceFragment.mockReturnValue({
    entries: {
      edges: [
        {
          id: "unsyncedEntry1",
        },
      ],
    },
  });

  createExperiencesManualUpdate(dataProxy, {
    data: {
      createExperiences: [
        {
          __typename: "ExperienceSuccess",
          experience: {
            id: "en1",
            entries: {},
          },
          entriesErrors: [
            {
              meta: {
                index: 0,
              },
            },
          ],
        },
      ],
    },
  } as CreateExperiencesMutationResult);

  const experience = {
    id: "en1",
    entries: {
      edges: [
        {
          id: "unsyncedEntry1",
        },
      ],
    },
  };

  expect(mockWriteExperienceFragmentToCache.mock.calls[0][1]).toEqual(
    experience,
  );

  expect(
    mockInsertExperiencesInGetExperiencesMiniQuery.mock.calls[0][1],
  ).toEqual([experience]);
});

test("synced and unsynced entries", () => {
  mockReadExperienceFragment.mockReturnValue({
    entries: {
      edges: [
        {
          id: "unsyncedEntry1",
        },
        {
          id: "unsyncedEntry2",
        },
      ],
    },
  });

  createExperiencesManualUpdate(dataProxy, {
    data: {
      createExperiences: [
        {
          __typename: "ExperienceSuccess",
          experience: {
            id: "en1",
            entries: {
              edges: [
                {
                  node: {
                    id: "syncedEntry2",
                  },
                },
              ],
            },
          },
          entriesErrors: [
            {
              meta: {
                index: 0,
              },
            },
            {
              meta: {
                index: null,
              },
            },
          ],
        },
      ],
    },
  } as CreateExperiencesMutationResult);

  const experience = {
    id: "en1",
    entries: {
      edges: [
        {
          id: "unsyncedEntry1",
        },
        {
          node: {
            id: "syncedEntry2",
          },
        },
      ],
    },
  };

  expect(mockWriteExperienceFragmentToCache.mock.calls[0][1]).toEqual(
    experience,
  );

  expect(
    mockInsertExperiencesInGetExperiencesMiniQuery.mock.calls[0][1],
  ).toEqual([experience]);
});

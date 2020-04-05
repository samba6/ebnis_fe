/* eslint-disable @typescript-eslint/no-explicit-any */
import { DataProxy } from "apollo-cache";
import {
  getSuccessfulResults,
  mapUpdateDataAndErrors,
} from "../apollo-cache/update-experiences";
import { floatExperiencesToTheTopInGetExperiencesMiniQuery } from "../apollo-cache/update-get-experiences-mini-query";
import { readExperienceFragment } from "../apollo-cache/read-experience-fragment";
import { writeExperienceFragmentToCache } from "../apollo-cache/write-experience-fragment";
import { UpdateExperiencesOnlineMutationResult } from "../graphql/experiences.gql";
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
import { UpdateExperienceFragment } from "../graphql/apollo-types/UpdateExperienceFragment";

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

describe("filter successfully updated experiences", () => {
  test("result is empty", () => {
    expect(
      getSuccessfulResults({
        data: {},
      } as UpdateExperiencesOnlineMutationResult),
    ).toEqual([]);
  });

  test("all fail", () => {
    expect(
      getSuccessfulResults({
        data: {
          updateExperiences: {
            __typename: "UpdateExperiencesAllFail",
          },
        },
      } as UpdateExperiencesOnlineMutationResult),
    ).toEqual([]);
  });

  test("successes and failures", () => {
    expect(
      getSuccessfulResults({
        data: {
          updateExperiences: {
            __typename: "UpdateExperiencesSomeSuccess",
            experiences: [
              {
                __typename: "UpdateExperienceErrors",
              },
              {
                __typename: "UpdateExperienceSomeSuccess",
                experience: {
                  experienceId: "1",
                },
              },
            ],
          },
        },
      } as UpdateExperiencesOnlineMutationResult),
    ).toEqual([{ experienceId: "1" }]);
  });
});

describe("update changes and errors - ownFields", () => {
  test("no update required", () => {
    expect(
      mapUpdateDataAndErrors([
        [{} as ExperienceFragment, {} as UpdateExperienceFragment],
      ]),
    ).toEqual([[{}, ...insertEmptyUpdates([null, false], "ownFields")]]);
  });

  test("failed", () => {
    expect(
      mapUpdateDataAndErrors([
        [
          {} as ExperienceFragment,
          {
            ownFields: {
              __typename: "UpdateExperienceOwnFieldsErrors",
            },
          } as UpdateExperienceFragment,
        ],
      ]),
    ).toEqual([[{}, ...insertEmptyUpdates([null, true], "ownFields")]]);
  });

  test("success", () => {
    expect(
      mapUpdateDataAndErrors([
        [
          {} as ExperienceFragment,
          {
            ownFields: {
              __typename: "ExperienceOwnFieldsSuccess",
              data: {
                title: "a",
                description: "b",
              },
            },
          } as UpdateExperienceFragment,
        ],
      ]),
    ).toEqual([
      [
        {},
        ...insertEmptyUpdates(
          [
            {
              title: "a",
              description: "b",
            },
            false,
          ],
          "ownFields",
        ),
      ],
    ]);
  });
});

describe("update changes and errors - definitions", () => {
  test("all failed", () => {
    expect(
      mapUpdateDataAndErrors([
        [
          {} as ExperienceFragment,
          {
            updatedDefinitions: [
              {
                __typename: "DefinitionErrors",
              },
            ],
          } as UpdateExperienceFragment,
        ],
      ]),
    ).toEqual([[{}, ...insertEmptyUpdates([null, true], "definitions")]]);
  });

  test("all success", () => {
    expect(
      mapUpdateDataAndErrors([
        [
          {} as ExperienceFragment,
          {
            updatedDefinitions: [
              {
                __typename: "DefinitionSuccess",
                definition: {
                  id: "1",
                },
              },
            ],
          } as UpdateExperienceFragment,
        ],
      ]),
    ).toEqual([
      [{}, ...insertEmptyUpdates([{ "1": { id: "1" } }, false], "definitions")],
    ]);
  });

  test("success and failure", () => {
    expect(
      mapUpdateDataAndErrors([
        [
          {} as ExperienceFragment,
          {
            updatedDefinitions: [
              {
                __typename: "DefinitionSuccess",
                definition: {
                  id: "1",
                },
              },
              {
                __typename: "DefinitionErrors",
              },
            ],
          } as UpdateExperienceFragment,
        ],
      ]),
    ).toEqual([
      [{}, ...insertEmptyUpdates([{ "1": { id: "1" } }, true], "definitions")],
    ]);
  });
});

describe("update changes and errors - new entries", () => {
  test("no success", () => {
    expect(
      mapUpdateDataAndErrors([
        [
          {} as ExperienceFragment,
          {
            newEntries: [
              {
                __typename: "CreateEntryErrors",
              },
            ],
          } as UpdateExperienceFragment,
        ],
      ]),
    ).toEqual([[{}, ...insertEmptyUpdates([null, true], "newEntries")]]);
  });

  test("no error", () => {
    expect(
      mapUpdateDataAndErrors([
        [
          {} as ExperienceFragment,
          {
            newEntries: [
              {
                __typename: "CreateEntrySuccess",
                entry: {
                  clientId: "1",
                },
              },
            ],
          } as UpdateExperienceFragment,
        ],
      ]),
    ).toEqual([
      [
        {},
        ...insertEmptyUpdates(
          [{ "1": { clientId: "1" } }, false],
          "newEntries",
        ),
      ],
    ]);
  });

  test("success and error", () => {
    expect(
      mapUpdateDataAndErrors([
        [
          {} as ExperienceFragment,
          {
            newEntries: [
              {
                __typename: "CreateEntryErrors",
              },
              {
                __typename: "CreateEntrySuccess",
                entry: {
                  clientId: "1",
                },
              },
            ],
          } as UpdateExperienceFragment,
        ],
      ]),
    ).toEqual([
      [
        {},
        ...insertEmptyUpdates([{ "1": { clientId: "1" } }, true], "newEntries"),
      ],
    ]);
  });
});

describe("updates and errors - updated entries", () => {
  const updateSuccess = {
    __typename: "UpdateEntrySomeSuccess",
    entry: {
      entryId: "1",
      dataObjects: [
        {
          __typename: "DataObjectSuccess",
          dataObject: {
            id: "2",
          },
        },
      ],
    },
  };

  test("no entry success", () => {
    expect(
      mapUpdateDataAndErrors([
        [
          {} as ExperienceFragment,
          {
            updatedEntries: [
              {
                __typename: "UpdateEntryErrors",
              },
            ],
          } as UpdateExperienceFragment,
        ],
      ]),
    ).toEqual([[{}, ...insertEmptyUpdates([null, true], "updatedEntries")]]);
  });

  test("no entry.dataObjects success", () => {
    expect(
      mapUpdateDataAndErrors([
        [
          {} as ExperienceFragment,
          {
            updatedEntries: [
              {
                __typename: "UpdateEntrySomeSuccess",
                entry: {
                  dataObjects: [
                    {
                      __typename: "DataObjectErrors",
                    },
                  ],
                },
              },
            ],
          } as UpdateExperienceFragment,
        ],
      ]),
    ).toEqual([[{}, ...insertEmptyUpdates([null, true], "updatedEntries")]]);
  });

  test("entry.dataObjects all success", () => {
    expect(
      mapUpdateDataAndErrors([
        [
          {} as ExperienceFragment,
          {
            updatedEntries: [updateSuccess],
          } as UpdateExperienceFragment,
        ],
      ]),
    ).toEqual([
      [
        {},
        ...insertEmptyUpdates(
          [
            {
              "1": {
                "2": { id: "2" },
              },
            },
            false,
          ],
          "updatedEntries",
        ),
      ],
    ]);
  });

  test("entry.dataObjects success and failure", () => {
    expect(
      mapUpdateDataAndErrors([
        [
          {} as ExperienceFragment,
          {
            updatedEntries: [
              {
                __typename: "UpdateEntryErrors",
              },
              updateSuccess,
            ],
          } as UpdateExperienceFragment,
        ],
      ]),
    ).toEqual([
      [
        {},
        ...insertEmptyUpdates(
          [
            {
              "1": {
                "2": { id: "2" },
              },
            },
            true,
          ],
          "updatedEntries",
        ),
      ],
    ]);
  });
});

const t = [null, false];
function insertEmptyUpdates(
  data: any,
  updated: "ownFields" | "definitions" | "newEntries" | "updatedEntries",
) {
  switch (updated) {
    case "ownFields":
      return [data, t, t, t];
    case "definitions":
      return [t, data, t, t];
    case "newEntries":
      return [t, t, data, t];
    case "updatedEntries":
      return [t, t, t, data];
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { DataProxy } from "apollo-cache";
import {
  getSuccessfulResults,
  mapUpdateDataAndErrors,
  MapUpdateDataAndErrors,
  getChangesAndCleanUpData,
  MapDefinitionsUpdatesAndErrors,
  MapNewEntriesUpdatesAndErrors,
  MapUpdatedEntriesUpdatesAndErrors,
  updateExperiencesInCache1,
  CleanUpData,
  StateValues,
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
import { DataDefinitionFragment } from "../graphql/apollo-types/DataDefinitionFragment";
import { DataObjectFragment } from "../graphql/apollo-types/DataObjectFragment";

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
    ).toEqual([
      [
        {},
        ...insertEmptyUpdates(
          [null, StateValues.ownFieldsNoErrors],
          "ownFields",
        ),
      ],
    ]);
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
    ).toEqual([
      [
        {},
        ...insertEmptyUpdates(
          [null, StateValues.ownFieldsHasErrors],
          "ownFields",
        ),
      ],
    ]);
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
            StateValues.ownFieldsNoErrors,
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
    ).toEqual([
      [
        {},
        ...insertEmptyUpdates(
          [null, StateValues.dataDefinitionHasErrors],
          "definitions",
        ),
      ],
    ]);
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
      [
        {},
        ...insertEmptyUpdates(
          [{ "1": { id: "1" } }, StateValues.dataDefinitionsNoErrors],
          "definitions",
        ),
      ],
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
      [
        {},
        ...insertEmptyUpdates(
          [{ "1": { id: "1" } }, StateValues.dataDefinitionHasErrors],
          "definitions",
        ),
      ],
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
    ).toEqual([
      [
        {},
        ...insertEmptyUpdates(
          [null, StateValues.newEntriesHasErrors],
          "newEntries",
        ),
      ],
    ]);
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
          [{ "1": { clientId: "1" } }, StateValues.newEntriesNoErrors],
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
        ...insertEmptyUpdates(
          [{ "1": { clientId: "1" } }, StateValues.newEntriesHasErrors],
          "newEntries",
        ),
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
    ).toEqual([
      [
        {},
        ...insertEmptyUpdates(
          [null, StateValues.updatedEntriesHasErrors],
          "updatedEntries",
        ),
      ],
    ]);
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
    ).toEqual([
      [
        {},
        ...insertEmptyUpdates(
          [null, StateValues.updatedEntriesHasErrors],
          "updatedEntries",
        ),
      ],
    ]);
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
            StateValues.updatedEntriesNoErrors,
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
            StateValues.updatedEntriesHasErrors,
          ],
          "updatedEntries",
        ),
      ],
    ]);
  });
});

describe("apply changes and get clean-up data", () => {
  const noUpdatesHasErrors = [null, true];
  const noUpdatesNoErrors = [null, false];

  test("all fail", () => {
    expect(
      getChangesAndCleanUpData([
        [
          {
            id: "1",
          } as ExperienceFragment,
          noUpdatesHasErrors,
          noUpdatesHasErrors,
          noUpdatesHasErrors,
          noUpdatesHasErrors,
        ],
      ] as MapUpdateDataAndErrors),
    ).toEqual([[], []]);
  });

  test("ownFields - no success", () => {
    expect(
      getChangesAndCleanUpData([
        [
          {
            id: "1",
          } as ExperienceFragment,
          noUpdatesHasErrors,
          noUpdatesNoErrors,
          noUpdatesNoErrors,
          noUpdatesNoErrors,
        ],
      ] as MapUpdateDataAndErrors),
    ).toEqual([
      [{ id: "1" }],
      [
        [
          "1",
          ...putCleanUpDataDefaults(
            StateValues.ownFieldsNoCleanUp,
            "ownFields",
          ),
        ],
      ],
    ]);
  });

  test("ownFields - no error", () => {
    const updateData = { title: "a", description: "b" };

    expect(
      getChangesAndCleanUpData([
        [
          {
            id: "z",
            title: "1",
            description: "2",
          } as ExperienceFragment,
          [updateData, false],
          noUpdatesNoErrors,
          noUpdatesNoErrors,
          noUpdatesNoErrors,
        ],
      ] as MapUpdateDataAndErrors),
    ).toEqual([
      [{ id: "z", ...updateData }],
      [
        [
          "z",
          ...putCleanUpDataDefaults(StateValues.ownFieldsCleanUp, "ownFields"),
        ],
      ],
    ]);
  });

  test("data definitions - no success", () => {
    expect(
      getChangesAndCleanUpData([
        [
          {
            id: "z",
          } as ExperienceFragment,
          noUpdatesNoErrors,
          noUpdatesHasErrors,
          noUpdatesNoErrors,
          noUpdatesNoErrors,
        ],
      ] as MapUpdateDataAndErrors),
    ).toEqual([
      [{ id: "z" }],
      [["z", ...putCleanUpDataDefaults([], "definitions")]],
    ]);
  });

  test("data definitions - no error", () => {
    expect(
      getChangesAndCleanUpData([
        [
          {
            id: "z",
            dataDefinitions: [
              {
                id: "1",
                name: "a",
              },
            ],
          } as ExperienceFragment,
          noUpdatesNoErrors,
          [
            {
              "1": { id: "1", name: "b" } as DataDefinitionFragment,
            },
            false,
          ] as MapDefinitionsUpdatesAndErrors,
          noUpdatesNoErrors,
          noUpdatesNoErrors,
        ],
      ] as MapUpdateDataAndErrors),
    ).toEqual([
      [
        {
          id: "z",
          dataDefinitions: [
            {
              id: "1",
              name: "b",
            },
          ],
        },
      ],
      [["z", ...putCleanUpDataDefaults(["1"], "definitions")]],
    ]);
  });

  test("data definitions - error and success", () => {
    expect(
      getChangesAndCleanUpData([
        [
          {
            id: "z",
            dataDefinitions: [
              {
                id: "1",
                name: "a",
              },
              {
                id: "2",
              },
            ],
          } as ExperienceFragment,
          noUpdatesNoErrors,
          [
            {
              "1": { id: "1", name: "b" } as DataDefinitionFragment,
            },
            true,
          ] as MapDefinitionsUpdatesAndErrors,
          noUpdatesNoErrors,
          noUpdatesNoErrors,
        ],
      ] as MapUpdateDataAndErrors),
    ).toEqual([
      [
        {
          id: "z",
          dataDefinitions: [
            {
              id: "1",
              name: "b",
            },
            {
              id: "2",
            },
          ],
        },
      ],
      [["z", ...putCleanUpDataDefaults(["1"], "definitions")]],
    ]);
  });

  test("new entries - no success", () => {
    expect(
      getChangesAndCleanUpData([
        [
          {
            id: "1",
          } as ExperienceFragment,
          noUpdatesNoErrors,
          noUpdatesNoErrors,
          noUpdatesHasErrors,
          noUpdatesNoErrors,
        ],
      ] as MapUpdateDataAndErrors),
    ).toEqual([
      [{ id: "1" }],
      [
        [
          "1",
          ...putCleanUpDataDefaults(
            StateValues.newEntriesNoCleanUp,
            "newEntries",
          ),
        ],
      ],
    ]);
  });

  test("new entries - no error", () => {
    expect(
      getChangesAndCleanUpData([
        [
          {
            id: "1",
            entries: {
              edges: [
                {
                  node: {
                    id: "1",
                  },
                },
              ],
            },
          } as ExperienceFragment,
          noUpdatesNoErrors,
          noUpdatesNoErrors,
          [
            { "1": { id: "1", dataObjects: [{}] } as EntryFragment },
            false,
          ] as MapNewEntriesUpdatesAndErrors,
          noUpdatesNoErrors,
        ],
      ] as MapUpdateDataAndErrors),
    ).toEqual([
      [
        {
          id: "1",
          entries: {
            edges: [
              {
                node: {
                  id: "1",
                  dataObjects: [{}],
                },
              },
            ],
          },
        },
      ],
      [
        [
          "1",
          ...putCleanUpDataDefaults(
            StateValues.newEntriesCleanUp,
            "newEntries",
          ),
        ],
      ],
    ]);
  });

  test("new entries - success and error", () => {
    expect(
      getChangesAndCleanUpData([
        [
          {
            id: "1",
            entries: {
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
              ],
            },
          } as ExperienceFragment,
          noUpdatesNoErrors,
          noUpdatesNoErrors,
          [
            { "1": { id: "1", dataObjects: [{}] } as EntryFragment },
            true,
          ] as MapNewEntriesUpdatesAndErrors,
          noUpdatesNoErrors,
        ],
      ] as MapUpdateDataAndErrors),
    ).toEqual([
      [
        {
          id: "1",
          entries: {
            edges: [
              {
                node: {
                  id: "1",
                  dataObjects: [{}],
                },
              },
              {
                node: {
                  id: "2",
                },
              },
            ],
          },
        },
      ],
      [
        [
          "1",
          ...putCleanUpDataDefaults(
            StateValues.newEntriesNoCleanUp,
            "newEntries",
          ),
        ],
      ],
    ]);
  });

  test("updated entries - no entry success", () => {
    expect(
      getChangesAndCleanUpData([
        [
          {
            id: "1",
            entries: {
              edges: [
                {
                  node: {
                    id: "1",
                  },
                },
              ],
            },
          } as ExperienceFragment,
          noUpdatesNoErrors,
          noUpdatesNoErrors,
          noUpdatesNoErrors,
          [{}, false] as MapUpdatedEntriesUpdatesAndErrors,
        ],
      ] as MapUpdateDataAndErrors),
    ).toEqual([
      [
        {
          id: "1",
          entries: {
            edges: [
              {
                node: {
                  id: "1",
                },
              },
            ],
          },
        },
      ],
      [["1", ...putCleanUpDataDefaults([], "updatedEntries")]],
    ]);
  });

  test("updated entries - entry success, no data object success", () => {
    expect(
      getChangesAndCleanUpData([
        [
          {
            id: "1",
            entries: {
              edges: [
                {
                  node: {
                    id: "1",
                    dataObjects: [
                      {
                        id: "1",
                      },
                    ],
                  },
                },
              ],
            },
          } as ExperienceFragment,
          noUpdatesNoErrors,
          noUpdatesNoErrors,
          noUpdatesNoErrors,
          [
            {
              "1": {},
            },
            false,
          ] as MapUpdatedEntriesUpdatesAndErrors,
        ],
      ] as MapUpdateDataAndErrors),
    ).toEqual([
      [
        {
          id: "1",
          entries: {
            edges: [
              {
                node: {
                  id: "1",
                  dataObjects: [
                    {
                      id: "1",
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
      [["1", ...putCleanUpDataDefaults([], "updatedEntries")]],
    ]);
  });

  test("updated entries - entry success, no data object error", () => {
    expect(
      getChangesAndCleanUpData([
        [
          {
            id: "1",
            entries: {
              edges: [
                {
                  node: {
                    id: "1",
                    dataObjects: [
                      {
                        id: "1",
                      },
                    ],
                  },
                },
              ],
            },
          } as ExperienceFragment,
          noUpdatesNoErrors,
          noUpdatesNoErrors,
          noUpdatesNoErrors,
          [
            {
              "1": {
                "1": { id: "1", data: "1" } as DataObjectFragment,
              },
            },
            false,
          ] as MapUpdatedEntriesUpdatesAndErrors,
        ],
      ] as MapUpdateDataAndErrors),
    ).toEqual([
      [
        {
          id: "1",
          entries: {
            edges: [
              {
                node: {
                  id: "1",
                  dataObjects: [
                    {
                      id: "1",
                      data: "1",
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
      [["1", ...putCleanUpDataDefaults([["1", "1"]], "updatedEntries")]],
    ]);
  });

  test("updated entries - entry success, data object error and success", () => {
    expect(
      getChangesAndCleanUpData([
        [
          {
            id: "1",
            entries: {
              edges: [
                {
                  node: {
                    id: "1",
                    dataObjects: [
                      {
                        id: "1",
                      },
                      {
                        id: "2",
                      },
                    ],
                  },
                },
              ],
            },
          } as ExperienceFragment,
          noUpdatesNoErrors,
          noUpdatesNoErrors,
          noUpdatesNoErrors,
          [
            {
              "1": {
                "1": { id: "1", data: "1" } as DataObjectFragment,
              },
            },
            true,
          ] as MapUpdatedEntriesUpdatesAndErrors,
        ],
      ] as MapUpdateDataAndErrors),
    ).toEqual([
      [
        {
          id: "1",
          entries: {
            edges: [
              {
                node: {
                  id: "1",
                  dataObjects: [
                    {
                      id: "1",
                      data: "1",
                    },
                    {
                      id: "2",
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
      [["1", ...putCleanUpDataDefaults([["1", "1"]], "updatedEntries")]],
    ]);
  });
});

describe("clean up unsynced data now synced", () => {
  test("ownFields - yes", () => {
    const unsynced = {
      ownFields: {},
    } as UnsyncedModifiedExperience;

    const cleanUpData = ([true] as unknown) as CleanUpData;

    expect(cleanUpUnsyncedOwnFields(unsynced, cleanUpData)).toEqual({});
  });
});

test("integration", () => {
  const mockOnDone = jest.fn();

  const serverResult = {
    data: {
      updateExperiences: {
        __typename: "UpdateExperiencesSomeSuccess",
        experiences: [
          {
            __typename: "UpdateExperienceErrors",
          },
          {
            __typename: "UpdateExperienceSomeSuccess",
            experience: {},
          },
        ],
      },
    },
  } as UpdateExperiencesOnlineMutationResult;

  updateExperiencesInCache1(mockOnDone)(dataProxy, serverResult);

  expect(mockOnDone).toHaveBeenCalled();
});

const ownFieldsEmptyUpdates = [null, StateValues.ownFieldsNoErrors];

const dataDefinitionsEmptyUpdates = [
  null, //
  StateValues.dataDefinitionsNoErrors,
];
const newEntriesEmptyUpdates = [null, StateValues.newEntriesNoErrors];
const updatedEntriesEmptyUpdates = [null, StateValues.updatedEntriesNoErrors];

function insertEmptyUpdates(
  data: any,
  updated: "ownFields" | "definitions" | "newEntries" | "updatedEntries",
) {
  switch (updated) {
    case "ownFields":
      return [
        data,
        dataDefinitionsEmptyUpdates,
        newEntriesEmptyUpdates,
        updatedEntriesEmptyUpdates,
      ];
    case "definitions":
      return [
        ownFieldsEmptyUpdates,
        data,
        newEntriesEmptyUpdates,
        updatedEntriesEmptyUpdates,
      ];
    case "newEntries":
      return [
        ownFieldsEmptyUpdates,
        dataDefinitionsEmptyUpdates,
        data,
        updatedEntriesEmptyUpdates,
      ];
    case "updatedEntries":
      return [
        ownFieldsEmptyUpdates,
        dataDefinitionsEmptyUpdates,
        newEntriesEmptyUpdates,
        data,
      ];
  }
}

function putCleanUpDataDefaults(
  data: any,
  updated: "ownFields" | "definitions" | "newEntries" | "updatedEntries",
) {
  switch (updated) {
    case "ownFields":
      return [data, [], StateValues.newEntriesCleanUp, []];
    case "definitions":
      return [
        StateValues.ownFieldsCleanUp,
        data,
        StateValues.newEntriesCleanUp,
        [],
      ];
    case "newEntries":
      return [StateValues.ownFieldsCleanUp, [], data, []];
    case "updatedEntries":
      return [
        StateValues.ownFieldsCleanUp,
        [],
        StateValues.newEntriesCleanUp,
        data,
      ];
  }
}

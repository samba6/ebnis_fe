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
          [null, StateValues.dataDefinitionsHasErrors],
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
          [{ "1": { id: "1" } }, StateValues.dataDefinitionsHasErrors],
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

const ownFieldsEmptyUpdatesNoErrors = [null, StateValues.ownFieldsNoErrors];
const dataDefinitionsEmptyUpdatesNoErrors = [
  null, //
  StateValues.dataDefinitionsNoErrors,
];
const newEntriesEmptyUpdatesNoErrors = [null, StateValues.newEntriesNoErrors];
const updatedEntriesEmptyUpdatesNoErrors = [
  null,
  StateValues.updatedEntriesNoErrors,
];

const ownFieldsEmptyUpdatesHasErrors = [null, StateValues.ownFieldsHasErrors];
const dataDefinitionsEmptyUpdatesHasErrors = [
  null, //
  StateValues.dataDefinitionsHasErrors,
];
const newEntriesEmptyUpdatesHasErrors = [
  null, //
  StateValues.newEntriesHasErrors,
];
const updatedEntriesEmptyUpdatesHasErrors = [
  null,
  StateValues.updatedEntriesHasErrors,
];

describe("apply changes and get clean-up data", () => {
  test("all fail", () => {
    expect(
      getChangesAndCleanUpData([
        [
          {
            id: "1",
          } as ExperienceFragment,
          ownFieldsEmptyUpdatesHasErrors,
          dataDefinitionsEmptyUpdatesHasErrors,
          newEntriesEmptyUpdatesHasErrors,
          updatedEntriesEmptyUpdatesHasErrors,
        ],
      ] as MapUpdateDataAndErrors),
    ).toEqual([[], []]);
  });

  test("ownFields - no success, has errors", () => {
    expect(
      getChangesAndCleanUpData([
        [
          {
            id: "1",
          } as ExperienceFragment,
          ownFieldsEmptyUpdatesHasErrors,
          dataDefinitionsEmptyUpdatesNoErrors,
          newEntriesEmptyUpdatesNoErrors,
          updatedEntriesEmptyUpdatesNoErrors,
        ],
      ] as MapUpdateDataAndErrors),
    ).toEqual([
      [{ id: "1" }],
      [
        [
          "1", //
          putEmptyCleanUpData(StateValues.ownFieldsNoCleanUp, "ownFields"),
        ],
      ],
    ]);
  });

  test("ownFields - has success, no error", () => {
    const updateData = { title: "a", description: "b" };

    expect(
      getChangesAndCleanUpData([
        [
          {
            id: "z",
            title: "1",
            description: "2",
          } as ExperienceFragment,
          [updateData, StateValues.ownFieldsNoErrors],
          dataDefinitionsEmptyUpdatesNoErrors,
          newEntriesEmptyUpdatesNoErrors,
          updatedEntriesEmptyUpdatesNoErrors,
        ],
      ] as MapUpdateDataAndErrors),
    ).toEqual([
      [{ id: "z", ...updateData }],
      [["z", putEmptyCleanUpData(StateValues.ownFieldsCleanUp, "ownFields")]],
    ]);
  });

  test("data definitions - no success", () => {
    expect(
      getChangesAndCleanUpData([
        [
          {
            id: "z",
          } as ExperienceFragment,
          ownFieldsEmptyUpdatesNoErrors,
          dataDefinitionsEmptyUpdatesHasErrors,
          newEntriesEmptyUpdatesNoErrors,
          updatedEntriesEmptyUpdatesNoErrors,
        ],
      ] as MapUpdateDataAndErrors),
    ).toEqual([[{ id: "z" }], [["z", putEmptyCleanUpData([], "definitions")]]]);
  });

  test("data definitions - has success, no error", () => {
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
          ownFieldsEmptyUpdatesNoErrors,
          [
            {
              "1": { id: "1", name: "b" } as DataDefinitionFragment,
            },
            StateValues.dataDefinitionsNoErrors,
          ] as MapDefinitionsUpdatesAndErrors,
          newEntriesEmptyUpdatesNoErrors,
          updatedEntriesEmptyUpdatesNoErrors,
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
      [["z", putEmptyCleanUpData(["1"], "definitions")]],
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
          ownFieldsEmptyUpdatesNoErrors,
          [
            {
              "1": { id: "1", name: "b" } as DataDefinitionFragment,
            },
            StateValues.dataDefinitionsHasErrors,
          ] as MapDefinitionsUpdatesAndErrors,
          newEntriesEmptyUpdatesNoErrors,
          updatedEntriesEmptyUpdatesNoErrors,
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
      [["z", putEmptyCleanUpData(["1"], "definitions")]],
    ]);
  });

  test("new entries - no success, has errors", () => {
    expect(
      getChangesAndCleanUpData([
        [
          {
            id: "1",
          } as ExperienceFragment,
          ownFieldsEmptyUpdatesNoErrors,
          dataDefinitionsEmptyUpdatesNoErrors,
          newEntriesEmptyUpdatesHasErrors,
          updatedEntriesEmptyUpdatesNoErrors,
        ],
      ] as MapUpdateDataAndErrors),
    ).toEqual([
      [{ id: "1" }],
      [
        [
          "1",
          putEmptyCleanUpData(StateValues.newEntriesNoCleanUp, "newEntries"),
        ],
      ],
    ]);
  });

  test("new entries - has success, no error", () => {
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
          ownFieldsEmptyUpdatesNoErrors,
          dataDefinitionsEmptyUpdatesNoErrors,
          [
            { "1": { id: "1", dataObjects: [{}] } as EntryFragment },
            StateValues.newEntriesNoErrors,
          ] as MapNewEntriesUpdatesAndErrors,
          updatedEntriesEmptyUpdatesNoErrors,
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
      [["1", putEmptyCleanUpData(StateValues.newEntriesCleanUp, "newEntries")]],
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
          ownFieldsEmptyUpdatesNoErrors,
          dataDefinitionsEmptyUpdatesNoErrors,
          [
            { "1": { id: "1", dataObjects: [{}] } as EntryFragment },
            StateValues.newEntriesHasErrors,
          ] as MapNewEntriesUpdatesAndErrors,
          updatedEntriesEmptyUpdatesNoErrors,
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
      [["1", putEmptyCleanUpData(StateValues.newEntriesCleanUp, "newEntries")]],
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
          ownFieldsEmptyUpdatesNoErrors,
          dataDefinitionsEmptyUpdatesNoErrors,
          newEntriesEmptyUpdatesNoErrors,
          [
            {},
            StateValues.updatedEntriesNoErrors,
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
                },
              },
            ],
          },
        },
      ],
      [["1", putEmptyCleanUpData([], "updatedEntries")]],
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
          ownFieldsEmptyUpdatesNoErrors,
          dataDefinitionsEmptyUpdatesNoErrors,
          newEntriesEmptyUpdatesNoErrors,
          [
            {
              "1": {},
            },
            StateValues.updatedEntriesNoErrors,
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
      [["1", putEmptyCleanUpData([], "updatedEntries")]],
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
          ownFieldsEmptyUpdatesNoErrors,
          dataDefinitionsEmptyUpdatesNoErrors,
          newEntriesEmptyUpdatesNoErrors,
          [
            {
              "1": {
                "1": { id: "1", data: "1" } as DataObjectFragment,
              },
            },
            StateValues.updatedEntriesNoErrors,
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
      [["1", putEmptyCleanUpData([["1", "1"]], "updatedEntries")]],
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
          ownFieldsEmptyUpdatesNoErrors,
          dataDefinitionsEmptyUpdatesNoErrors,
          newEntriesEmptyUpdatesNoErrors,
          [
            {
              "1": {
                "1": { id: "1", data: "1" } as DataObjectFragment,
              },
            },
            StateValues.updatedEntriesHasErrors,
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
      [["1", putEmptyCleanUpData([["1", "1"]], "updatedEntries")]],
    ]);
  });
});

describe("clean up unsynced data now synced", () => {
  test("ownFields - yes", () => {
    const unsynced = {
      ownFields: {},
    } as UnsyncedModifiedExperience;

    const cleanUpData = ([
      StateValues.ownFieldsCleanUp,
    ] as unknown) as CleanUpData;

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

function insertEmptyUpdates(
  data: any,
  updated: "ownFields" | "definitions" | "newEntries" | "updatedEntries",
) {
  switch (updated) {
    case "ownFields":
      return [
        data,
        dataDefinitionsEmptyUpdatesNoErrors,
        newEntriesEmptyUpdatesNoErrors,
        updatedEntriesEmptyUpdatesNoErrors,
      ];
    case "definitions":
      return [
        ownFieldsEmptyUpdatesNoErrors,
        data,
        newEntriesEmptyUpdatesNoErrors,
        updatedEntriesEmptyUpdatesNoErrors,
      ];
    case "newEntries":
      return [
        ownFieldsEmptyUpdatesNoErrors,
        dataDefinitionsEmptyUpdatesNoErrors,
        data,
        updatedEntriesEmptyUpdatesNoErrors,
      ];
    case "updatedEntries":
      return [
        ownFieldsEmptyUpdatesNoErrors,
        dataDefinitionsEmptyUpdatesNoErrors,
        newEntriesEmptyUpdatesNoErrors,
        data,
      ];
  }
}

function putEmptyCleanUpData(
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

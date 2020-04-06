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
  cleanUpSynced,
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
import { UpdateExperienceSomeSuccessFragment } from "../graphql/apollo-types/UpdateExperienceSomeSuccessFragment";
import { ExperienceFragment } from "../graphql/apollo-types/ExperienceFragment";
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
                errors: {
                  experienceId: "1",
                },
              },
              {
                __typename: "UpdateExperienceSomeSuccess",
                experience: {
                  experienceId: "2",
                },
              },
            ],
          },
        },
      } as UpdateExperiencesOnlineMutationResult),
    ).toEqual([{ experienceId: "2" }]);
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

  test("data definitions - has error, has success", () => {
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
                    // success == remove from unsynced
                    id: "1",
                  },
                },
                {
                  node: {
                    // error == leave in unsynced
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
      [
        [
          "1",
          putEmptyCleanUpData(StateValues.newEntriesNoCleanUp, "newEntries"),
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
  test("ownFields - clean up", () => {
    const unsynced = {
      ownFields: {},
    } as UnsyncedModifiedExperience;

    const cleanUpData = putEmptyCleanUpData(
      StateValues.ownFieldsCleanUp,
      "ownFields",
    );

    expect(cleanUpSynced(unsynced, cleanUpData)).toEqual({});
  });

  test("ownFields - no clean up", () => {
    const unsynced = {
      ownFields: {},
    } as UnsyncedModifiedExperience;

    const cleanUpData = putEmptyCleanUpData(
      StateValues.ownFieldsNoCleanUp,
      "ownFields",
    );

    expect(cleanUpSynced(unsynced, cleanUpData)).toEqual({
      ownFields: {},
    });
  });

  test("data definitions - clean up, unsynced def not found", () => {
    const unsynced = {} as UnsyncedModifiedExperience;
    const cleanUpData = putEmptyCleanUpData(["1"], "definitions");
    expect(cleanUpSynced(unsynced, cleanUpData)).toEqual({});
  });

  test("data definitions - clean up, unsynced def found, not all cleaned", () => {
    const unsynced = {
      definitions: {
        "1": {},
        "2": {},
      },
    } as UnsyncedModifiedExperience;

    const cleanUpData = putEmptyCleanUpData(["1"], "definitions");

    expect(cleanUpSynced(unsynced, cleanUpData)).toEqual({
      definitions: {
        "2": {},
      },
    });
  });

  test("data definitions - clean up, unsynced def found, all cleaned", () => {
    const unsynced = {
      definitions: {
        "1": {},
      },
    } as UnsyncedModifiedExperience;

    const cleanUpData = putEmptyCleanUpData(["1"], "definitions");

    expect(cleanUpSynced(unsynced, cleanUpData)).toEqual({});
  });

  test("new entries - clean up", () => {
    const unsynced = {
      newEntries: true,
    } as UnsyncedModifiedExperience;

    const cleanUpData = putEmptyCleanUpData(
      StateValues.newEntriesCleanUp,
      "newEntries",
    );

    expect(cleanUpSynced(unsynced, cleanUpData)).toEqual({});
  });

  test("new entries - no clean up", () => {
    const unsynced = {
      newEntries: true,
    } as UnsyncedModifiedExperience;

    const cleanUpData = putEmptyCleanUpData(
      StateValues.newEntriesNoCleanUp,
      "newEntries",
    );

    expect(cleanUpSynced(unsynced, cleanUpData)).toEqual({
      newEntries: true,
    });
  });

  test("updated entries - no clean up", () => {
    const unsynced = {
      modifiedEntries: {},
    } as UnsyncedModifiedExperience;

    const cleanUpData = putEmptyCleanUpData([], "updatedEntries");

    expect(cleanUpSynced(unsynced, cleanUpData)).toEqual({
      modifiedEntries: {},
    });
  });

  test("updated entries - clean up, no unsynced", () => {
    const unsynced = {
      ownFields: {},
    } as UnsyncedModifiedExperience;

    const cleanUpData = putEmptyCleanUpData([], "updatedEntries");
    cleanUpData[0] = StateValues.ownFieldsNoCleanUp;

    expect(cleanUpSynced(unsynced, cleanUpData)).toEqual({
      ownFields: {},
    });
  });

  test("updated entries - clean up, entry not in unsynced", () => {
    const unsynced = {
      modifiedEntries: {
        "1": {},
      },
    } as UnsyncedModifiedExperience;

    const cleanUpData = putEmptyCleanUpData([["2"]], "updatedEntries");

    expect(cleanUpSynced(unsynced, cleanUpData)).toEqual({
      modifiedEntries: {
        "1": {},
      },
    });
  });

  test("updated entries - clean up, all unsynced cleaned", () => {
    const unsynced = {
      modifiedEntries: {
        "1": {
          "1": true,
        },
      },
    } as UnsyncedModifiedExperience;

    const cleanUpData = putEmptyCleanUpData([["1", "1"]], "updatedEntries");

    expect(cleanUpSynced(unsynced, cleanUpData)).toEqual({});
  });

  test("updated entries - clean up, not all unsynced cleaned", () => {
    const unsynced = {
      modifiedEntries: {
        "1": {
          "1": true,
          "2": true,
        },
      },
    } as UnsyncedModifiedExperience;

    const cleanUpData = putEmptyCleanUpData([["1", "1"]], "updatedEntries");

    expect(cleanUpSynced(unsynced, cleanUpData)).toEqual({
      modifiedEntries: {
        "1": {
          "2": true,
        },
      },
    });
  });
});

test("integration", () => {
  const mockOnDone = jest.fn();

  const updatedExperience0 = {
    __typename: "UpdateExperienceErrors",
  };

  const updatedExperience1 = {
    __typename: "UpdateExperienceSomeSuccess",
    experience: {
      experienceId: "1",
    },
  } as UpdateExperienceSomeSuccessFragment;

  const mockExperienceFragment1 = null;

  const updatedExperience2 = {
    __typename: "UpdateExperienceSomeSuccess",
    experience: {
      experienceId: "2",
    },
  } as UpdateExperienceSomeSuccessFragment;

  const mockExperienceFragment2 = {
    id: "2",
  } as ExperienceFragment;

  const mockUnsynced2 = null;

  const updatedExperience3 = {
    __typename: "UpdateExperienceSomeSuccess",
    experience: {
      experienceId: "3",
      ownFields: {
        __typename: "ExperienceOwnFieldsSuccess",
        data: {
          title: "3tt",
          description: "3dd",
        },
      },
      updatedDefinitions: [
        {
          __typename: "DefinitionSuccess",
          definition: {
            id: "3dd1",
            name: "3dddN1",
          },
        },
      ],
    },
  } as UpdateExperienceSomeSuccessFragment;

  const mockExperienceFragment3 = {
    id: "3",
    title: "3t",
    description: "3d",
    dataDefinitions: [
      {
        id: "3dd1",
        name: "3ddN1",
      },
      {
        id: "3dd2",
        name: "3ddN2",
      },
    ],
  } as ExperienceFragment;

  const mockUnsynced3 = {
    ownFields: {},
    definitions: {
      "3dd1": {},
    },
  } as UnsyncedModifiedExperience;

  const updatedExperience4 = {
    __typename: "UpdateExperienceSomeSuccess",
    experience: {
      experienceId: "4",
      newEntries: [
        {
          __typename: "CreateEntrySuccess",
          entry: {
            // create success
            id: "4en1",
            clientId: "4en1", // diff from cache'
            dataObjects: [
              {
                id: "4ddo1", // diff from cache'
                data: "4ddod1", // diff from cache'
              },
            ],
          },
        },
        {
          __typename: "CreateEntryErrors",
        },
      ],
      updatedEntries: [
        {
          __typename: "UpdateEntryErrors",
        },
        {
          __typename: "UpdateEntrySomeSuccess",
          entry: {
            entryId: "4en2",
            dataObjects: [
              {
                __typename: "DataObjectErrors",
              },
              {
                __typename: "DataObjectSuccess",
                dataObject: {
                  id: "4do1",
                  data: "4ddod1", // diff from cache'
                },
              },
            ],
          },
        },
      ],
    },
  } as UpdateExperienceSomeSuccessFragment;

  const mockExperienceFragment4 = {
    id: "4",
    entries: {
      edges: [
        {
          node: {
            // create success
            id: "4en1",
            clientId: "no", // diff from server's
            dataObjects: [
              {
                id: "4do1", // diff from server's
                data: "4dod1", // diff from server's
              },
            ],
          },
        },
        {
          node: {
            // update success
            id: "4en2",
            dataObjects: [
              {
                // update success
                id: "4do1",
                data: "4dod1", // diff from server's
              },
              {
                // update failed
                id: "4do2",
                data: "4dod2",
              },
            ],
          },
        },
        {
          node: {
            // untouched
            id: "4en3",
            dataObjects: [
              {
                id: "4do1",
                data: "4dod2",
              },
            ],
          },
        },
      ],
    },
  } as ExperienceFragment;

  const mockUnsynced4 = {
    newEntries: true,
    modifiedEntries: {
      "4en2": {
        "4do1": true, // success
        "4do2": true, // failed
      },
    },
  } as UnsyncedModifiedExperience;

  const serverResult = {
    data: {
      updateExperiences: {
        __typename: "UpdateExperiencesSomeSuccess",
        experiences: [
          updatedExperience0,
          updatedExperience1,
          updatedExperience2,
          updatedExperience3,
          updatedExperience4,
        ],
      },
    },
  } as UpdateExperiencesOnlineMutationResult;

  mockReadExperienceFragment
    .mockReturnValueOnce(mockExperienceFragment1)
    .mockReturnValueOnce(mockExperienceFragment2)
    .mockReturnValueOnce(mockExperienceFragment3)
    .mockReturnValueOnce(mockExperienceFragment4);

  mockGetUnsyncedExperience
    .mockReturnValueOnce(mockUnsynced2)
    .mockReturnValueOnce(mockUnsynced3)
    .mockReturnValueOnce(mockUnsynced4);

  updateExperiencesInCache1(mockOnDone)(dataProxy, serverResult);

  expect(
    mockFloatExperiencesToTheTopInGetExperiencesMiniQuery.mock.calls[0][1],
  ).toEqual({
    "2": 1,
    "3": 1,
    "4": 1,
  });

  expect(
    mockWriteExperienceFragmentToCache.mock.calls.map(([, b]) => b),
  ).toEqual([
    {
      id: "2",
    },
    {
      id: "3",
      title: "3tt",
      description: "3dd",
      dataDefinitions: [
        {
          id: "3dd1",
          name: "3dddN1",
        },
        {
          id: "3dd2",
          name: "3ddN2",
        },
      ],
    },
    {
      id: "4",
      entries: {
        edges: [
          {
            node: {
              // create success
              id: "4en1",
              clientId: "4en1",
              dataObjects: [
                {
                  id: "4ddo1",
                  data: "4ddod1",
                },
              ],
            },
          },
          {
            node: {
              // update success
              id: "4en2",
              dataObjects: [
                {
                  // update success
                  id: "4do1",
                  data: "4ddod1",
                },
                {
                  // update failed
                  id: "4do2",
                  data: "4dod2",
                },
              ],
            },
          },
          {
            node: {
              // untouched
              id: "4en3",
              dataObjects: [
                {
                  id: "4do1",
                  data: "4dod2",
                },
              ],
            },
          },
        ],
      },
    },
  ]);

  expect(
    mockRemoveUnsyncedExperience.mock.calls.map(x => {
      return x[0];
    }),
  ).toEqual(["3"]);

  expect(mockWriteUnsyncedExperience.mock.calls).toEqual([
    [
      "4",
      {
        newEntries: true,
        modifiedEntries: {
          "4en2": {
            "4do2": true, // failed
          },
        },
      },
    ],
  ]);

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
): CleanUpData {
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

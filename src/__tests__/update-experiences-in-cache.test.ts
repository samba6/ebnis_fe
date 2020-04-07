/* eslint-disable @typescript-eslint/no-explicit-any */
import { DataProxy } from "apollo-cache";
import {
  getSuccessfulResults,
  getUpdatesAndCleanUpData,
  UpdatesData,
  applyUpdatesToExperiences,
  updateExperiencesInCache,
  CleanUpData,
  StateValues,
  updateUnSyncedLedger,
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
import { entryToEdge } from "../state/resolvers/entry-to-edge";

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

const testExperience = {
  id: "a",
} as ExperienceFragment;

describe("get changes and clean up data - ownFields", () => {
  test("ownFields: failed", () => {
    const received = getUpdatesAndCleanUpData([
      [
        testExperience,
        {
          ownFields: {
            __typename: "UpdateExperienceOwnFieldsErrors",
          },
        } as UpdateExperienceFragment,
      ],
    ]);

    const [updateData, cleanUpData] = putEmptyUpdatesAndCleanUpData(
      null,
      StateValues.ownFieldsNoCleanUp,
      0,
    );

    const expected = [
      [[testExperience, ...updateData]],
      [[testExperience.id, ...cleanUpData]],
    ];

    expect(received).toEqual(expected);
  });

  test("ownFields: success", () => {
    const received = getUpdatesAndCleanUpData([
      [
        testExperience,
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
    ]);

    const ownFieldsUpdates = {
      title: "a",
      description: "b",
    };

    const [updateData, cleanUpData] = putEmptyUpdatesAndCleanUpData(
      ownFieldsUpdates,
      StateValues.ownFieldsCleanUp,
      0,
    );

    const expected = [
      [[testExperience, ...updateData]],
      [[testExperience.id, ...cleanUpData]],
    ];

    expect(received).toEqual(expected);
  });
});

describe("get changes and clean up data - definitions", () => {
  test("all failed", () => {
    const received = getUpdatesAndCleanUpData([
      [
        testExperience,
        {
          updatedDefinitions: [
            {
              __typename: "DefinitionErrors",
            },
          ],
        } as UpdateExperienceFragment,
      ],
    ]);

    const [updateData, cleanUpData] = putEmptyUpdatesAndCleanUpData(
      null,
      [],
      1,
    );

    const expected = [
      [[testExperience, ...updateData]],
      [[testExperience.id, ...cleanUpData]],
    ];

    expect(received).toEqual(expected);
  });

  test("all success", () => {
    const received = getUpdatesAndCleanUpData([
      [
        testExperience,
        {
          updatedDefinitions: [
            {
              __typename: "DefinitionSuccess",
              definition: {
                id: "b",
              },
            },
          ],
        } as UpdateExperienceFragment,
      ],
    ]);

    const [updateData, cleanUpData] = putEmptyUpdatesAndCleanUpData(
      {
        b: {
          id: "b",
        },
      },
      ["b"],
      1,
    );

    const expected = [
      [[testExperience, ...updateData]],
      [[testExperience.id, ...cleanUpData]],
    ];

    expect(received).toEqual(expected);
  });

  test("success and failure", () => {
    const received = getUpdatesAndCleanUpData([
      [
        testExperience,
        {
          updatedDefinitions: [
            {
              __typename: "DefinitionSuccess",
              definition: {
                id: "a",
              },
            },
            {
              __typename: "DefinitionErrors",
            },
          ],
        } as UpdateExperienceFragment,
      ],
    ]);

    const [updateData, cleanUpData] = putEmptyUpdatesAndCleanUpData(
      {
        a: {
          id: "a",
        },
      },
      ["a"],
      1,
    );

    const expected = [
      [[testExperience, ...updateData]],
      [[testExperience.id, ...cleanUpData]],
    ];

    expect(received).toEqual(expected);
  });
});

describe("get changes and clean up data - new entries", () => {
  test("brand new error, no success", () => {
    const received = getUpdatesAndCleanUpData([
      [
        testExperience,
        {
          newEntries: [
            {
              __typename: "CreateEntryErrors",
            },
          ],
        } as UpdateExperienceFragment,
      ],
    ]);

    const [updateData, cleanUpData] = putEmptyUpdatesAndCleanUpData(
      null,
      StateValues.newEntriesNoCleanUp,
      2,
    );

    const expected = [
      [[testExperience, ...updateData]],
      [[testExperience.id, ...cleanUpData]],
    ];

    expect(received).toEqual(expected);
  });

  test("offline synced success - no error,", () => {
    const received = getUpdatesAndCleanUpData([
      [
        testExperience,
        {
          newEntries: [
            {
              __typename: "CreateEntrySuccess",
              entry: {
                clientId: "b",
              },
            },
          ],
        } as UpdateExperienceFragment,
      ],
    ]);

    const brandNewEntries = [] as any;

    const offlineSyncedEntries = {
      b: {
        clientId: "b",
      },
    } as any;

    const newEntriesUpdates = [brandNewEntries, offlineSyncedEntries];

    const [updateData, cleanUpData] = putEmptyUpdatesAndCleanUpData(
      newEntriesUpdates,
      StateValues.newEntriesCleanUp,
      2,
    );

    const expected = [
      [[testExperience, ...updateData]],
      [[testExperience.id, ...cleanUpData]],
    ];

    expect(received).toEqual(expected);
  });

  test("brand new success - no error, offline synced error - no success", () => {
    const received = getUpdatesAndCleanUpData([
      [
        testExperience,
        {
          newEntries: [
            {
              __typename: "CreateEntrySuccess",
              entry: {
                id: "b",
              },
            },
            {
              __typename: "CreateEntryErrors",
              errors: {
                meta: {
                  clientId: "c",
                },
              },
            },
          ],
        } as UpdateExperienceFragment,
      ],
    ]);

    const brandNewEntries = [
      {
        id: "b",
      },
    ];

    const offlineSyncedEntries = null;

    const [updateData, cleanUpData] = putEmptyUpdatesAndCleanUpData(
      [brandNewEntries, offlineSyncedEntries],
      StateValues.newEntriesNoCleanUp,
      2,
    );

    const expected = [
      [[testExperience, ...updateData]],
      [[testExperience.id, ...cleanUpData]],
    ];

    expect(received).toEqual(expected);
  });

  test("offline synced success, brand new success, brand new error", () => {
    const received = getUpdatesAndCleanUpData([
      [
        testExperience,
        {
          newEntries: [
            {
              __typename: "CreateEntryErrors",
            },
            {
              __typename: "CreateEntrySuccess",
              entry: {
                clientId: "b",
              },
            },
            {
              __typename: "CreateEntrySuccess",
              entry: {
                id: "c",
              },
            },
          ],
        } as UpdateExperienceFragment,
      ],
    ]);

    const brandNewEntries = [
      {
        id: "c",
      },
    ];

    const offlineSyncedEntries = {
      b: {
        clientId: "b",
      },
    };

    const [updateData, cleanUpData] = putEmptyUpdatesAndCleanUpData(
      [brandNewEntries, offlineSyncedEntries],
      StateValues.newEntriesCleanUp,
      2,
    );

    const expected = [
      [[testExperience, ...updateData]],
      [[testExperience.id, ...cleanUpData]],
    ];

    expect(received).toEqual(expected);
  });
});

describe("get changes and clean up data - updated entries", () => {
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
    const received = getUpdatesAndCleanUpData([
      [
        testExperience,
        {
          updatedEntries: [
            {
              __typename: "UpdateEntryErrors",
            },
          ],
        } as UpdateExperienceFragment,
      ],
    ]);

    const [updateData, cleanUpData] = putEmptyUpdatesAndCleanUpData(
      null,
      [],
      3,
    );

    const expected = [
      [[testExperience, ...updateData]],
      [[testExperience.id, ...cleanUpData]],
    ];

    expect(received).toEqual(expected);
  });

  test("no entry.dataObjects success", () => {
    const received = getUpdatesAndCleanUpData([
      [
        testExperience,
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
    ]);

    const [updateData, cleanUpData] = putEmptyUpdatesAndCleanUpData(
      null,
      [],
      3,
    );

    const expected = [
      [[testExperience, ...updateData]],
      [[testExperience.id, ...cleanUpData]],
    ];

    expect(received).toEqual(expected);
  });

  test("entry.dataObjects all success", () => {
    const received = getUpdatesAndCleanUpData([
      [
        testExperience,
        {
          updatedEntries: [updateSuccess],
        } as UpdateExperienceFragment,
      ],
    ]);

    const [updateData, cleanUpData] = putEmptyUpdatesAndCleanUpData(
      {
        "1": {
          "2": { id: "2" },
        },
      },
      [["1", "2"]],
      3,
    );

    const expected = [
      [[testExperience, ...updateData]],
      [[testExperience.id, ...cleanUpData]],
    ];

    expect(received).toEqual(expected);
  });

  test("entry.dataObjects success and failure", () => {
    const received = getUpdatesAndCleanUpData([
      [
        testExperience,
        {
          updatedEntries: [
            {
              __typename: "UpdateEntryErrors",
            },
            updateSuccess,
          ],
        } as UpdateExperienceFragment,
      ],
    ]);

    const [updateData, cleanUpData] = putEmptyUpdatesAndCleanUpData(
      {
        "1": {
          "2": { id: "2" },
        },
      },
      [["1", "2"]],
      3,
    );

    const expected = [
      [[testExperience, ...updateData]],
      [[testExperience.id, ...cleanUpData]],
    ];

    expect(received).toEqual(expected);
  });
});

describe("apply changes to experiences", () => {
  test("ownFields - no success, has errors", () => {
    const received = applyUpdatesToExperiences([
      [
        {
          id: "1",
        } as ExperienceFragment,
        ...putEmptyUpdates(null, 0),
      ],
    ] as UpdatesData);

    const expected = [
      {
        id: "1",
      },
    ];

    expect(received).toEqual(expected);
  });

  test("ownFields - has success, no error", () => {
    const updateData = {
      title: "a",
      description: "b",
    };

    const received = applyUpdatesToExperiences([
      [
        {
          id: "z",
          title: "1",
          description: "2",
        } as ExperienceFragment,
        ...putEmptyUpdates(updateData, 0),
      ],
    ] as UpdatesData);

    const expected = [
      {
        id: "z",
        ...updateData,
      },
    ];

    expect(received).toEqual(expected);
  });

  test("data definitions - has success, no error", () => {
    const received = applyUpdatesToExperiences([
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
        ...putEmptyUpdates(
          {
            "1": {
              id: "1",
              name: "b",
            } as DataDefinitionFragment,
          },
          1,
        ),
      ],
    ] as UpdatesData);

    const expected = [
      {
        id: "z",
        dataDefinitions: [
          {
            id: "1",
            name: "b",
          },
        ],
      },
    ];

    expect(received).toEqual(expected);
  });

  test("data definitions - has error, has success", () => {
    const received = applyUpdatesToExperiences([
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
        ...putEmptyUpdates(
          {
            "1": {
              id: "1",
              name: "b",
            } as DataDefinitionFragment,
          },
          1,
        ),
      ],
    ] as UpdatesData);

    const expected = [
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
    ];

    expect(received).toEqual(expected);
  });

  test("offlineSyncedEntries success, no brandNewEntries, no error", () => {
    const offlineClientId = "z";

    const offlineEntry = {
      id: offlineClientId,
      clientId: "2", // diff from server's
    };

    const brandNewEntries = [] as any;

    const syncedOfflineEntry = {
      id: "3",
      clientId: "4",
      dataObjects: [{}],
    } as EntryFragment;

    const offlineSyncedEntries = {
      [offlineClientId]: syncedOfflineEntry,
    };

    const received = applyUpdatesToExperiences([
      [
        {
          id: "1",
          entries: {
            edges: [
              {
                node: offlineEntry,
              },
            ],
          },
        } as ExperienceFragment,
        ...putEmptyUpdates([brandNewEntries, offlineSyncedEntries], 2),
      ],
    ] as UpdatesData);

    const expected = [
      {
        id: "1",
        entries: {
          edges: [
            {
              node: syncedOfflineEntry,
            },
          ],
        },
      },
    ];

    expect(received).toEqual(expected);
  });

  test("no offlineSyncedEntries, brandNewEntries, no error", () => {
    const brandNewEntry = {
      id: "a",
    } as EntryFragment;
    const brandNewEntries = [brandNewEntry] as any;
    const offlineSyncedEntries = null;

    const received = applyUpdatesToExperiences([
      [
        {
          id: "1",
          entries: {
            edges: [{}],
          },
        } as ExperienceFragment,
        ...putEmptyUpdates([brandNewEntries, offlineSyncedEntries], 2),
      ],
    ] as UpdatesData);

    const expected = [
      {
        id: "1",
        entries: {
          edges: [entryToEdge(brandNewEntry), {}],
        },
      },
    ];

    expect(received).toEqual(expected);
  });

  test("offlineSyncedEntries success and error", () => {
    const offlineClientId = "t";
    const offlineEntryBeforeSync = {
      id: offlineClientId,
    };

    const offlineEntryNotSynced = {
      id: "m",
    };

    const syncedOfflineEntry = {
      id: "k",
      dataObjects: [{}],
    } as EntryFragment;

    const offlineSyncedEntries = {
      [offlineClientId]: syncedOfflineEntry,
    };

    const brandNewEntries = [] as any;

    const received = applyUpdatesToExperiences([
      [
        {
          id: "1",
          entries: {
            edges: [
              {
                node: offlineEntryBeforeSync,
              },
              {
                node: offlineEntryNotSynced,
              },
            ],
          },
        } as ExperienceFragment,
        ...putEmptyUpdates([brandNewEntries, offlineSyncedEntries], 2),
      ],
    ] as UpdatesData);

    const expected = [
      {
        id: "1",
        entries: {
          edges: [
            {
              node: syncedOfflineEntry,
            },
            {
              node: offlineEntryNotSynced,
            },
          ],
        },
      },
    ];

    expect(received).toEqual(expected);
  });

  test("updated entries - no updated entry found", () => {
    const entry = {
      id: "k",
    };

    const received = applyUpdatesToExperiences([
      [
        {
          id: "1",
          entries: {
            edges: [
              {
                node: entry,
              },
            ],
          },
        } as ExperienceFragment,
        ...putEmptyUpdates(
          {
            "1": {},
          },
          3,
        ),
      ],
    ] as UpdatesData);

    const expected = [
      {
        id: "1",
        entries: {
          edges: [
            {
              node: entry,
            },
          ],
        },
      },
    ];

    expect(received).toEqual(expected);
  });

  test("updated entries - success", () => {
    const entry = {
      id: "1",
      dataObjects: [
        {
          id: "1",
        },
        {
          id: "2",
        },
      ],
    };

    const received = applyUpdatesToExperiences([
      [
        {
          id: "1",
          entries: {
            edges: [
              {
                node: entry,
              },
            ],
          },
        } as ExperienceFragment,
        ...putEmptyUpdates(
          {
            "1": {
              "1": {
                id: "1",
                data: "1",
              } as DataObjectFragment,
            },
          },
          3,
        ),
      ],
    ] as UpdatesData);

    const expected = [
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
    ];

    expect(received).toEqual(expected);
  });
});

describe("clean up unsynced data now synced", () => {
  test("ownFields - clean up", () => {
    const unsynced = {
      ownFields: {},
    } as UnsyncedModifiedExperience;

    const cleanUpData = putEmptyCleanUpData(StateValues.ownFieldsCleanUp, 0);
    const received = updateUnSyncedLedger(unsynced, cleanUpData);
    expect(received).toEqual({});
  });

  test("ownFields - no clean up", () => {
    const unsynced = {
      ownFields: {},
    } as UnsyncedModifiedExperience;

    const cleanUpData = putEmptyCleanUpData(StateValues.ownFieldsNoCleanUp, 0);
    const received = updateUnSyncedLedger(unsynced, cleanUpData);
    const expected = {
      ownFields: {},
    };

    expect(received).toEqual(expected);
  });

  test("data definitions - clean up, unsynced def not found", () => {
    const unsynced = {} as UnsyncedModifiedExperience;
    const cleanUpData = putEmptyCleanUpData(["1"], 1);
    const received = updateUnSyncedLedger(unsynced, cleanUpData);
    expect(received).toEqual({});
  });

  test("data definitions - clean up, unsynced def found, not all cleaned", () => {
    const unsynced = {
      definitions: {
        "1": {},
        "2": {},
      },
    } as UnsyncedModifiedExperience;

    const cleanUpData = putEmptyCleanUpData(["1"], 1);
    const received = updateUnSyncedLedger(unsynced, cleanUpData);
    const expected = {
      definitions: {
        "2": {},
      },
    };

    expect(received).toEqual(expected);
  });

  test("data definitions - clean up, unsynced def found, all cleaned", () => {
    const unsynced = {
      definitions: {
        "1": {},
      },
    } as UnsyncedModifiedExperience;

    const cleanUpData = putEmptyCleanUpData(["1"], 1);
    const received = updateUnSyncedLedger(unsynced, cleanUpData);

    expect(received).toEqual({});
  });

  test("new entries - clean up", () => {
    const unsynced = {
      newEntries: true,
    } as UnsyncedModifiedExperience;

    const cleanUpData = putEmptyCleanUpData(StateValues.newEntriesCleanUp, 2);
    const received = updateUnSyncedLedger(unsynced, cleanUpData);

    expect(received).toEqual({});
  });

  test("new entries - no clean up", () => {
    const unsynced = {
      newEntries: true,
    } as UnsyncedModifiedExperience;

    const cleanUpData = putEmptyCleanUpData(StateValues.newEntriesNoCleanUp, 2);
    const received = updateUnSyncedLedger(unsynced, cleanUpData);
    const expected = {
      newEntries: true,
    };

    expect(received).toEqual(expected);
  });

  test("updated entries - no clean up", () => {
    const unsynced = {
      modifiedEntries: {},
    } as UnsyncedModifiedExperience;

    const cleanUpData = putEmptyCleanUpData([], 3);
    const received = updateUnSyncedLedger(unsynced, cleanUpData);
    const expected = {
      modifiedEntries: {},
    };

    expect(received).toEqual(expected);
  });

  test("updated entries - clean up, no unsynced", () => {
    const unsynced = {
      ownFields: {},
    } as UnsyncedModifiedExperience;

    const cleanUpData = putEmptyCleanUpData([], 3);
    cleanUpData[0] = StateValues.ownFieldsNoCleanUp;
    const received = updateUnSyncedLedger(unsynced, cleanUpData);
    const expected = {
      ownFields: {},
    };

    expect(received).toEqual(expected);
  });

  test("updated entries - clean up, modifiedEntries not in cache", () => {
    const unsynced = {
      newEntries: true,
    } as UnsyncedModifiedExperience;

    const cleanUpData = putEmptyCleanUpData([["2"]], 3);
    cleanUpData[2] = StateValues.newEntriesNoCleanUp;
    const received = updateUnSyncedLedger(unsynced, cleanUpData);
    const expected = {
      newEntries: true,
    };

    expect(received).toEqual(expected);
  });

  test("updated entries - clean up, entry not in cached unsynced", () => {
    const unsynced = {
      modifiedEntries: {
        "1": {},
      },
    } as UnsyncedModifiedExperience;

    const cleanUpData = putEmptyCleanUpData([["2"]], 3);
    const received = updateUnSyncedLedger(unsynced, cleanUpData);
    const expected = {
      modifiedEntries: {
        "1": {},
      },
    };

    expect(received).toEqual(expected);
  });

  test("updated entries - clean up, all unsynced cleaned", () => {
    const unsynced = {
      modifiedEntries: {
        "1": {
          "1": true,
        },
      },
    } as UnsyncedModifiedExperience;

    const cleanUpData = putEmptyCleanUpData([["1", "1"]], 3);
    const received = updateUnSyncedLedger(unsynced, cleanUpData);

    expect(received).toEqual({});
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

    const cleanUpData = putEmptyCleanUpData([["1", "1"]], 3);
    const received = updateUnSyncedLedger(unsynced, cleanUpData);
    const expected = {
      modifiedEntries: {
        "1": {
          "2": true,
        },
      },
    };

    expect(received).toEqual(expected);
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
          errors: {
            meta: {
              clientId: "t",
            },
          },
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

  updateExperiencesInCache(mockOnDone)(dataProxy, serverResult);

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

const emptyUpdates = [null, null, null, null];

const emptyCleanUps = [
  StateValues.ownFieldsNoCleanUp,
  [],
  StateValues.newEntriesNoCleanUp,
  [],
];

function putEmptyUpdates(updatedData: any, index: number) {
  const x = [...emptyUpdates];
  x.splice(index, 1, updatedData);
  return x;
}

function putEmptyUpdatesAndCleanUpData(
  updatedData: any,
  cleanUpData: any,
  index: number,
) {
  return [
    putEmptyUpdates(updatedData, index),
    putEmptyCleanUpData(cleanUpData, index),
  ];
}

function putEmptyCleanUpData(cleanUpData: any, index: number): CleanUpData {
  const y = [...emptyCleanUps];
  y.splice(index, 1, cleanUpData);
  return (y as unknown) as CleanUpData;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { DataProxy } from "apollo-cache";
import {
  filterSuccessfulUpdates,
  updateExperiencesInCache,
  CleanUpData,
  StateValues,
  updateUnSyncedLedger,
  applyUpdatesAndGetCleanUpData,
} from "../apollo-cache/update-experiences";
import { floatExperiencesToTopInGetExperiencesMiniQuery } from "../apollo-cache/update-get-experiences-mini-query";
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
import { entryToEdge } from "../state/resolvers/entry-to-edge";

jest.mock("../apollo-cache/unsynced.resolvers");
const mockGetUnsyncedExperience = getUnsyncedExperience as jest.Mock;
const mockWriteUnsyncedExperience = writeUnsyncedExperience as jest.Mock;
const mockRemoveUnsyncedExperience = removeUnsyncedExperience as jest.Mock;

jest.mock("../apollo-cache/update-get-experiences-mini-query");
const mockFloatExperiencesToTopInGetExperiencesMiniQuery = floatExperiencesToTopInGetExperiencesMiniQuery as jest.Mock;

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
      filterSuccessfulUpdates({
        data: {},
      } as UpdateExperiencesOnlineMutationResult),
    ).toEqual([]);
  });

  test("all fail", () => {
    expect(
      filterSuccessfulUpdates({
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
      filterSuccessfulUpdates({
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

describe("apply updates and get clean up data", () => {
  describe("ownFields", () => {
    test("failed", () => {
      const received = applyUpdatesAndGetCleanUpData([
        [
          testExperience,
          {
            ownFields: {
              __typename: "UpdateExperienceOwnFieldsErrors",
            },
          } as UpdateExperienceFragment,
        ],
      ]);

      const cleanUpData = putEmptyCleanUpData(
        StateValues.ownFieldsNoCleanUp,
        0,
      );

      const expected = [
        [testExperience],
        [[testExperience.id, ...cleanUpData]],
      ];

      expect(received).toEqual(expected);
    });

    test("ownFields: success", () => {
      const ownFieldsUpdates = {
        title: "a",
        description: "b",
      };

      const received = applyUpdatesAndGetCleanUpData([
        [
          testExperience,
          {
            ownFields: {
              __typename: "ExperienceOwnFieldsSuccess",
              data: ownFieldsUpdates,
            },
          } as UpdateExperienceFragment,
        ],
      ]);

      const cleanUpData = putEmptyCleanUpData(StateValues.ownFieldsCleanUp, 0);

      const expected = [
        [{ ...testExperience, ...ownFieldsUpdates }],
        [[testExperience.id, ...cleanUpData]],
      ];

      expect(received).toEqual(expected);
    });
  });

  describe("definitions", () => {
    test("all failed", () => {
      const received = applyUpdatesAndGetCleanUpData([
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

      const cleanUpData = putEmptyCleanUpData([], 1);

      const expected = [
        [testExperience],
        [[testExperience.id, ...cleanUpData]],
      ];

      expect(received).toEqual(expected);
    });

    test("all success", () => {
      const updatedDefinition = {
        id: "a",
        name: "b",
      } as DataDefinitionFragment;

      const received = applyUpdatesAndGetCleanUpData([
        [
          {
            ...testExperience,
            dataDefinitions: [
              {
                ...updatedDefinition,
                name: "a",
              },
              {
                // not updated
                id: "t",
              },
            ] as DataDefinitionFragment[],
          },
          {
            updatedDefinitions: [
              {
                __typename: "DefinitionSuccess",
                definition: updatedDefinition,
              },
            ],
          } as UpdateExperienceFragment,
        ],
      ]);

      const cleanUpData = putEmptyCleanUpData([updatedDefinition.id], 1);

      const expected = [
        [
          {
            ...testExperience,
            dataDefinitions: [
              updatedDefinition,
              {
                id: "t",
              },
            ],
          },
        ],
        [[testExperience.id, ...cleanUpData]],
      ];

      expect(received).toEqual(expected);
    });
  });

  describe("new entries", () => {
    test("brand new error, no success", () => {
      const experience = {
        ...testExperience,
        entries: {
          edges: [],
        } as any,
      };

      const received = applyUpdatesAndGetCleanUpData([
        [
          experience,
          {
            newEntries: [
              {
                __typename: "CreateEntryErrors",
              },
            ],
          } as UpdateExperienceFragment,
        ],
      ]);

      const cleanUpData = putEmptyCleanUpData(
        StateValues.newEntriesNoCleanUp,
        2,
      );

      const expected = [[experience], [[testExperience.id, ...cleanUpData]]];

      expect(received).toEqual(expected);
    });

    test("offline synced success - no error,", () => {
      const offlineEntry = {
        id: "z",
      };

      const newEntry = {
        id: "3",
        clientId: offlineEntry.id,
      };

      const received = applyUpdatesAndGetCleanUpData([
        [
          {
            ...testExperience,
            entries: {
              edges: [
                {
                  node: offlineEntry,
                },
              ],
            } as any,
          },
          {
            newEntries: [
              {
                __typename: "CreateEntrySuccess",
                entry: newEntry,
              },
            ],
          } as UpdateExperienceFragment,
        ],
      ]);

      const cleanUpData = putEmptyCleanUpData(StateValues.newEntriesCleanUp, 2);

      const expected = [
        [
          {
            ...testExperience,
            entries: {
              edges: [
                {
                  node: newEntry,
                },
              ],
            },
          },
        ],
        [[testExperience.id, ...cleanUpData]],
      ];

      expect(received).toEqual(expected);
    });

    test("brand new success/no error, offline synced error/no success", () => {
      const newEntry = {
        id: "b",
      };

      const received = applyUpdatesAndGetCleanUpData([
        [
          {
            ...testExperience,
            entries: {
              edges: [],
            } as any,
          },
          {
            newEntries: [
              {
                __typename: "CreateEntrySuccess",
                entry: newEntry,
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

      const cleanUpData = putEmptyCleanUpData(
        StateValues.newEntriesNoCleanUp,
        2,
      );

      const expected = [
        [
          {
            ...testExperience,
            entries: {
              edges: [entryToEdge(newEntry as any)],
            },
          },
        ],
        [[testExperience.id, ...cleanUpData]],
      ];

      expect(received).toEqual(expected);
    });

    test("offline synced success, brand new success, brand new error", () => {
      const offlineEntrySynced = {
        id: "a",
        clientId: "b",
      };

      const brandNewEntry = {
        id: "c",
      };

      const received = applyUpdatesAndGetCleanUpData([
        [
          {
            ...testExperience,
            entries: {
              edges: [
                {
                  node: {
                    id: offlineEntrySynced.clientId,
                  },
                },
              ],
            } as any,
          },
          {
            newEntries: [
              {
                __typename: "CreateEntryErrors",
              },
              {
                __typename: "CreateEntrySuccess",
                entry: offlineEntrySynced,
              },
              {
                __typename: "CreateEntrySuccess",
                entry: brandNewEntry,
              },
            ],
          } as UpdateExperienceFragment,
        ],
      ]);

      const cleanUpData = putEmptyCleanUpData(StateValues.newEntriesCleanUp, 2);

      const expected = [
        [
          {
            ...testExperience,
            entries: {
              edges: [
                entryToEdge(brandNewEntry as any),
                {
                  node: offlineEntrySynced,
                },
              ],
            },
          },
        ],
        [[testExperience.id, ...cleanUpData]],
      ];

      expect(received).toEqual(expected);
    });
  });

  describe("updated entries", () => {
    test("no entry success", () => {
      const received = applyUpdatesAndGetCleanUpData([
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

      const cleanUpData = putEmptyCleanUpData([], 3);

      const expected = [
        [testExperience],
        [[testExperience.id, ...cleanUpData]],
      ];

      expect(received).toEqual(expected);
    });

    test("no entry.dataObjects success, entry.dataObject error", () => {
      const received = applyUpdatesAndGetCleanUpData([
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

      const cleanUpData = putEmptyCleanUpData([], 3);

      const expected = [
        [testExperience],
        [[testExperience.id, ...cleanUpData]],
      ];

      expect(received).toEqual(expected);
    });

    test("entry.dataObjects all success", () => {
      const updatedDataObject = {
        id: "2",
        data: "d",
      };

      const entryId = "w";

      const received = applyUpdatesAndGetCleanUpData([
        [
          {
            ...testExperience,
            entries: {
              edges: [
                {
                  node: {
                    id: entryId,
                    dataObjects: [
                      {
                        id: updatedDataObject.id,
                      },
                    ],
                  },
                },
                {
                  node: {
                    id: "`",
                  },
                },
              ],
            } as any,
          },
          {
            updatedEntries: [
              {
                __typename: "UpdateEntrySomeSuccess",
                entry: {
                  entryId,
                  dataObjects: [
                    {
                      __typename: "DataObjectSuccess",
                      dataObject: updatedDataObject,
                    },
                  ],
                },
              },
            ],
          } as UpdateExperienceFragment,
        ],
      ]);

      const cleanUpData = putEmptyCleanUpData(
        [[entryId, updatedDataObject.id]],
        3,
      );

      const expected = [
        [
          {
            ...testExperience,
            entries: {
              edges: [
                {
                  node: {
                    id: entryId,
                    dataObjects: [updatedDataObject],
                  },
                },
                {
                  node: {
                    id: "`",
                  },
                },
              ],
            },
          },
        ],
        [[testExperience.id, ...cleanUpData]],
      ];

      expect(received).toEqual(expected);
    });
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
      newEntries: [
        {
          __typename: "CreateEntrySuccess",
          entry: {
            id: "3en1",
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
    entries: {
      edges: [] as any,
    },
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
                data: "41dod1", // diff from cache'
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
                  data: "41dod1", // diff from cache'
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
    mockFloatExperiencesToTopInGetExperiencesMiniQuery.mock.calls[0][1],
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
      entries: {
        edges: [
          entryToEdge({
            id: "3en1",
          } as EntryFragment),
        ],
      },
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
                  data: "41dod1",
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
                  data: "41dod1",
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

const emptyCleanUps = [
  StateValues.ownFieldsNoCleanUp,
  [],
  StateValues.newEntriesNoCleanUp,
  [],
];

function putEmptyCleanUpData(cleanUpData: any, index: number): CleanUpData {
  const y = [...emptyCleanUps];
  y.splice(index, 1, cleanUpData);
  return (y as unknown) as CleanUpData;
}

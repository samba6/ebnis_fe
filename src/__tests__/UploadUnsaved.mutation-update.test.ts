/* eslint-disable @typescript-eslint/no-explicit-any */
import { onUploadSuccessUpdate } from "../components/UploadUnsaved/mutation-update";

jest.mock("../state/resolvers-utils");

import {
  writeSavedExperiencesWithUnsavedEntriesToCache,
  writeUnsavedExperiencesToCache,
  getSavedExperiencesWithUnsavedEntriesFromCache,
  updateGetExperiencesQuery,
  removeAllReferencesToEntityFromCache,
} from "../state/resolvers-utils";

const mockGetSavedExperiencesWithUnsavedEntries = getSavedExperiencesWithUnsavedEntriesFromCache as jest.Mock;

const mockWriteSavedExperiencesWithUnsavedEntriesToCache = writeSavedExperiencesWithUnsavedEntriesToCache as jest.Mock;

const mockWriteUnsavedExperiencesToCache = writeUnsavedExperiencesToCache as jest.Mock;

const mockUpdateGetExperiencesQuery = updateGetExperiencesQuery as jest.Mock;

const mockRemoveAllReferencesToEntityFromCache = removeAllReferencesToEntityFromCache as jest.Mock;

const mockDataProxy = {
  writeQuery: jest.fn(),
} as any;

beforeEach(() => {
  mockGetSavedExperiencesWithUnsavedEntries.mockReset();
  mockGetSavedExperiencesWithUnsavedEntries.mockReturnValue([]);

  mockWriteSavedExperiencesWithUnsavedEntriesToCache.mockReset();
  mockWriteUnsavedExperiencesToCache.mockReset();

  mockUpdateGetExperiencesQuery.mockReset();

  mockRemoveAllReferencesToEntityFromCache.mockReset();
});

it("does not update if no 'createEntries' and 'saveOfflineExperiences' operations", () => {
  const createEntries = null;
  const saveOfflineExperiences = null;

  const result = onUploadSuccessUpdate({} as any)(mockDataProxy, {
    data: { createEntries, saveOfflineExperiences } as any,
  });

  expect(result.updatedSavedExperiences).not.toBeDefined();
  expect(result.didUnsavedExperiencesUpdate).toBe(false);
});

it("returns empty updated experiences list if result of 'createEntries' operation is empty", () => {
  const createEntriesOperationResult = [] as any;

  const result = onUploadSuccessUpdate({} as any)(mockDataProxy, {
    data: {
      createEntries: createEntriesOperationResult,
    } as any,
  });

  expect(result.updatedSavedExperiences).toEqual([]);
});

it("does not update if result of 'saveOfflineExperiences' operation is empty", () => {
  const saveOfflineExperiencesResult = [] as any;

  const result = onUploadSuccessUpdate({} as any)(mockDataProxy, {
    data: {
      saveOfflineExperiences: saveOfflineExperiencesResult,
    } as any,
  });

  expect(result.didUnsavedExperiencesUpdate).toBe(false);
});

it("returns empty updated experiences list if 'createEntries' operation's entries list is empty", () => {
  const createEntriesOperationResult = [
    {
      entries: [],
    },
  ];

  const result = onUploadSuccessUpdate({} as any)(mockDataProxy, {
    data: {
      createEntries: createEntriesOperationResult,
    } as any,
  });

  expect(result.updatedSavedExperiences).toEqual([]);

  expect(mockGetSavedExperiencesWithUnsavedEntries).not.toHaveBeenCalled();
});

it("returns empty updated experiences list if 'createEntries' operation's experience ID not in saved experiences map", () => {
  const savedExperiencesIdsToUnsavedEntriesMap = {};
  const createEntriesOperationEntry = {};

  const createEntriesOperationResult = [
    {
      expId: "1",
      entries: [createEntriesOperationEntry],
    },
  ];

  const result = onUploadSuccessUpdate({
    savedExperiencesIdsToUnsavedEntriesMap,
  } as any)(mockDataProxy, {
    data: {
      createEntries: createEntriesOperationResult,
    } as any,
  });

  expect(result.updatedSavedExperiences).toEqual([]);

  expect(mockGetSavedExperiencesWithUnsavedEntries).not.toHaveBeenCalled();
});

it("removes saved experience from cache only if 'createEntries' operation returns no error for that experience", async done => {
  const unsavedEntry1 = {
    id: "unsaved-entry-1",
    clientId: "a",
  } as any;

  const savedEntry1 = {
    id: "saved-entry-1",
    clientId: "b",
  } as any;

  // No 'createEntries' operation errors
  const savedExperience1 = {
    id: "1",

    entries: {
      edges: [
        {
          node: unsavedEntry1,
        },

        {
          node: savedEntry1,
        },
      ],
    },
  } as any;

  const unsavedEntry2 = {
    id: "unsaved-entry-2",
    clientId: "c",
  } as any;

  // has 'createEntries' operation errors
  const savedExperience2 = {
    id: "2",

    entries: {
      edges: [
        {
          node: unsavedEntry2,
        },
      ],
    },
  } as any;

  const savedExperiencesIdsToUnsavedEntriesMap = {
    "1": {
      experience: savedExperience1,
      unsavedEntries: [unsavedEntry1],
    },

    "2": {
      experience: savedExperience2,
      unsavedEntries: [unsavedEntry2],
    },
  };

  const createEntriesOperationEntry1 = {
    ...unsavedEntry1,
    id: "created1",
  };

  const createEntriesOperationEntry2 = {
    ...unsavedEntry2,
    id: "created2",
  };

  const createEntriesOperationResult = [
    {
      experienceId: "1",
      entries: [createEntriesOperationEntry1],
    },

    {
      experienceId: "2",
      entries: [createEntriesOperationEntry2],
      errors: {},
    },
  ];

  const result = onUploadSuccessUpdate({
    savedExperiencesIdsToUnsavedEntriesMap,
  } as any)(mockDataProxy, {
    data: {
      createEntries: createEntriesOperationResult as any,
    } as any,
  });

  const [
    updatedExperience1,
    updatedExperience2,
  ] = result.updatedSavedExperiences as any;

  const edges1 = updatedExperience1.entries.edges;
  expect(edges1[0].node).toEqual(createEntriesOperationEntry1);
  expect(edges1[1].node).toEqual(savedEntry1);

  const edges2 = updatedExperience2.entries.edges;
  expect(edges2[0].node).toEqual(createEntriesOperationEntry2);

  expect(
    mockWriteSavedExperiencesWithUnsavedEntriesToCache.mock.calls[0][1],
  ).toEqual([updatedExperience2]);

  done();
});

it("removes unsaved experience from cache only if 'saveOfflineExperiences' operation returns no error for that experience", () => {
  // No 'saveOfflineExperiences' operation errors
  // saving it succeeded, so we remove all references to it from cache
  const experience1 = {
    id: "unsaved-id-1",
    clientId: "1",

    entries: {
      edges: [],
    },
  } as any;

  const operationResultExperience1 = { ...experience1, id: "1" };

  // saving this will succeed so we need to remove all references to it from
  // cache
  const entry21 = {
    id: "unsaved-entry-1",
    clientId: "a",
  } as any;

  const entry22 = {
    id: "unsaved-entry-2",
    clientId: "b",
  } as any;

  // has 'saveOfflineExperiences' operation 'entriesErrors'
  // saving it partially succeeds, so we remove all references to it from
  // cache
  const experience2 = {
    id: "unsaved-id-2",
    clientId: "2",
    entries: {
      edges: [
        {
          node: entry21,
        },

        {
          node: entry22,
        },
      ],
    },
  } as any;

  const operationResultEntry21 = { ...entry21, id: "saved-entry-1" };

  const operationResultExperience2 = {
    ...experience2,
    id: "2",
    entries: {
      edges: [
        {
          node: operationResultEntry21,
        },
      ],
    },
  };

  // has 'saveOfflineExperiences' operation 'experienceError' error
  const experience3 = {
    id: "3",
    clientId: "3",
  } as any;

  // not part of 'saveOfflineExperiences' operation result, but exists in cache
  const experience4 = {};

  const operationResults = [
    {
      experience: operationResultExperience1,
    },

    {
      experience: operationResultExperience2,

      entriesErrors: [
        {
          clientId: entry22.clientId,
        },
      ],
    },

    {
      experienceError: {
        clientId: "3",
      },
    },
  ];

  const { didUnsavedExperiencesUpdate } = onUploadSuccessUpdate({
    unsavedExperiences: [experience1, experience2, experience3, experience4],
  } as any)(mockDataProxy, {
    data: {
      saveOfflineExperiences: operationResults as any,
    } as any,
  });

  expect(didUnsavedExperiencesUpdate).toBe(true);

  expect(mockWriteUnsavedExperiencesToCache.mock.calls[0][1]).toEqual([
    experience3,
    experience4,
  ]);

  const updatedExperience2 = {
    ...experience2,
    id: "2",
    entries: {
      edges: [
        {
          node: operationResultEntry21,
        },

        {
          node: entry22,
        },
      ],
    },
  };

  expect(
    mockWriteSavedExperiencesWithUnsavedEntriesToCache.mock.calls[0][1],
  ).toEqual([updatedExperience2]);

  expect(mockUpdateGetExperiencesQuery).toHaveBeenCalled();

  const referencesToRemove = mockRemoveAllReferencesToEntityFromCache.mock
    .calls[0][1] as any;

  expect(
    referencesToRemove.sort((a: any, b: any) => {
      const aid = a.id.toUpperCase();
      const bid = b.id.toUpperCase();

      if (aid < bid) {
        return -1;
      }

      if (aid > bid) {
        return 1;
      }

      return 0;
    }),
  ).toEqual([
    { id: "unsaved-id-1", typename: undefined },
    { id: "unsaved-id-2", typename: undefined },
  ]);
});

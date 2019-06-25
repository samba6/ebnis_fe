// tslint:disable: no-any
import { onUploadSuccessUpdate } from "../components/Sync/mutation-update";
// import { CreateEntriesResponseFragment } from "../graphql/apollo-types/CreateEntriesResponseFragment";

jest.mock("../state/resolvers-utils");

import {
  writeSavedExperiencesWithUnsavedEntriesToCache,
  getSavedExperiencesWithUnsavedEntriesFromCache,
  getUnsavedExperiencesFromCache
} from "../state/resolvers-utils";

const mockGetSavedExperiencesWithUnsavedEntries = getSavedExperiencesWithUnsavedEntriesFromCache as jest.Mock;

const mockGetUnsavedExperiencesFromCache = getUnsavedExperiencesFromCache as jest.Mock;

const mockWriteSavedExperiencesWithUnsavedEntriesToCache = writeSavedExperiencesWithUnsavedEntriesToCache as jest.Mock;

const mockDataProxy = {
  writeQuery: jest.fn()
} as any;

beforeEach(() => {
  mockGetSavedExperiencesWithUnsavedEntries.mockReset();
  mockGetSavedExperiencesWithUnsavedEntries.mockReturnValue([]);

  mockGetUnsavedExperiencesFromCache.mockReset();
  mockGetUnsavedExperiencesFromCache.mockReturnValue([]);

  mockWriteSavedExperiencesWithUnsavedEntriesToCache.mockReset();
});

it("does not update if no 'createEntries' and 'syncOfflineExperiences' operations", () => {
  const createEntries = null;
  const syncOfflineExperiences = null;

  const result = onUploadSuccessUpdate({})(mockDataProxy, {
    data: { createEntries, syncOfflineExperiences } as any
  });

  expect(result.updatedSavedExperiences).not.toBeDefined();
  expect(result.updatedUnsavedExperiences).not.toBeDefined();
});

it("returns empty updated experiences list if result of 'createEntries' operation is empty", () => {
  const createEntriesOperationResult = [] as any;

  const result = onUploadSuccessUpdate({})(mockDataProxy, {
    data: {
      createEntries: createEntriesOperationResult
    } as any
  });

  expect(result.updatedSavedExperiences).toEqual([]);

  expect(mockGetSavedExperiencesWithUnsavedEntries).not.toHaveBeenCalled();
});

it("does not update if result of 'syncOfflineExperiences' operation is empty", () => {
  const syncOfflineExperiencesResult = [] as any;

  const result = onUploadSuccessUpdate({})(mockDataProxy, {
    data: {
      syncOfflineExperiences: syncOfflineExperiencesResult
    } as any
  });

  expect(result.updatedUnsavedExperiences).toEqual([]);
});

it("returns empty updated experiences list if 'createEntries' operation's entries list is empty", () => {
  const createEntriesOperationResult = [
    {
      entries: []
    }
  ];

  const result = onUploadSuccessUpdate({})(mockDataProxy, {
    data: {
      createEntries: createEntriesOperationResult
    } as any
  });

  expect(result.updatedSavedExperiences).toEqual([]);

  expect(mockGetSavedExperiencesWithUnsavedEntries).not.toHaveBeenCalled();
});

it("returns empty updated experiences list if 'createEntries' operation's experience ID not in saved experiences map", () => {
  const savedExperiencesMap = {};
  const createEntriesOperationEntry = {};

  const createEntriesOperationResult = [
    {
      expId: "1",
      entries: [createEntriesOperationEntry]
    }
  ];

  const result = onUploadSuccessUpdate(savedExperiencesMap)(mockDataProxy, {
    data: {
      createEntries: createEntriesOperationResult
    } as any
  });

  expect(result.updatedSavedExperiences).toEqual([]);

  expect(mockGetSavedExperiencesWithUnsavedEntries).not.toHaveBeenCalled();
});

it("removes saved experience from cache only if 'createEntries' operation returns no error for that experience", async done => {
  const unsavedEntry1 = {
    id: "unsaved-entry-1",
    clientId: "a"
  } as any;

  const savedEntry1 = {
    id: "saved-entry-1",
    clientId: "b"
  } as any;

  // No 'createEntries' operation errors
  const savedExperience1 = {
    id: "1",

    entries: {
      edges: [
        {
          node: unsavedEntry1
        },

        {
          node: savedEntry1
        }
      ]
    }
  } as any;

  const unsavedEntry2 = {
    id: "unsaved-entry-2",
    clientId: "c"
  } as any;

  // has 'createEntries' operation errors
  const savedExperience2 = {
    id: "2",

    entries: {
      edges: [
        {
          node: unsavedEntry2
        }
      ]
    }
  } as any;

  // not part of 'createEntries' operation, but exists in cache
  const savedExperience3 = { id: "3" };

  mockGetSavedExperiencesWithUnsavedEntries.mockReturnValue([
    savedExperience1,
    savedExperience2,
    savedExperience3
  ]);

  const savedExperiencesMap = {
    "1": {
      experience: savedExperience1,
      unsavedEntries: [unsavedEntry1]
    },

    "2": {
      experience: savedExperience2,
      unsavedEntries: [unsavedEntry2]
    }
  };

  const createEntriesOperationEntry1 = {
    ...unsavedEntry1,
    id: "created1"
  };

  const createEntriesOperationEntry2 = {
    ...unsavedEntry2,
    id: "created2"
  };

  const createEntriesOperationResult = [
    {
      expId: "1",
      entries: [createEntriesOperationEntry1]
    },

    {
      expId: "2",
      entries: [createEntriesOperationEntry2],
      errors: {}
    }
  ];

  const result = onUploadSuccessUpdate(savedExperiencesMap)(mockDataProxy, {
    data: {
      createEntries: createEntriesOperationResult as any
    } as any
  });

  const [
    updatedExperience1,
    updatedExperience2
  ] = result.updatedSavedExperiences as any;

  const edges1 = updatedExperience1.entries.edges;
  expect(edges1[0].node).toEqual(createEntriesOperationEntry1);
  expect(edges1[1].node).toEqual(savedEntry1);

  const edges2 = updatedExperience2.entries.edges;
  expect(edges2[0].node).toEqual(createEntriesOperationEntry2);

  expect(
    mockWriteSavedExperiencesWithUnsavedEntriesToCache.mock.calls[0][1]
  ).toEqual([updatedExperience2, savedExperience3]);

  done();
});

it.skip("removes unsaved experience from cache only if 'syncOfflineExperiences' operation returns no error for that experience", () => {
  // No 'syncOfflineExperiences' operation errors
  const experience1 = {
    id: "1",
    clientId: "1"
  } as any;

  // has 'syncOfflineExperiences' operation 'entriesErrors'
  const experience2 = {
    id: "2",
    clientId: "2"
  } as any;

  // has 'syncOfflineExperiences' operation 'experienceError' error
  const experience3 = {
    id: "3",
    clientId: "3"
  } as any;

  // not part of 'syncOfflineExperiences' operation result, but exists in cache
  const experience4 = { id: "4" };

  mockGetUnsavedExperiencesFromCache.mockReturnValue([
    experience1,
    experience2,
    experience3,
    experience4
  ]);

  const operationResults = [
    {
      experience: experience1
    },

    {
      experience: experience2,
      entriesErrors: {}
    },

    {
      experienceError: {
        clientId: "3"
      }
    }
  ];

  onUploadSuccessUpdate({})(mockDataProxy, {
    data: {
      syncOfflineExperiences: operationResults as any
    } as any
  });

  // const [, updatedExperience2] = result.updatedSavedExperiences as any;

  expect(
    mockWriteSavedExperiencesWithUnsavedEntriesToCache.mock.calls[0][1]
  ).toEqual([experience2]);
});

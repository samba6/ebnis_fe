import { DataProxy } from "apollo-cache";
import { upsertExperienceWithEntry } from "../components/NewEntry/new-entry.injectables";
import { readExperienceFragment } from "../apollo-cache/read-experience-fragment";
import {
  ExperienceFragment,
  ExperienceFragment_entries_edges,
} from "../graphql/apollo-types/ExperienceFragment";
import {
  CreateOnlineEntryMutation_createEntry,
  CreateOnlineEntryMutation,
} from "../graphql/apollo-types/CreateOnlineEntryMutation";
import { EntryFragment } from "../graphql/apollo-types/EntryFragment";
import { writeExperienceFragmentToCache } from "../apollo-cache/write-experience-fragment";
import { floatExperienceToTheTopInGetExperiencesMiniQuery } from "../apollo-cache/update-get-experiences-mini-query";

jest.mock("../apollo-cache/write-experience-fragment");
const mockWriteExperienceFragmentToCache = writeExperienceFragmentToCache as jest.Mock;

jest.mock("../apollo-cache/read-experience-fragment");
const mockReadGetExperienceFullQueryFromCache = readExperienceFragment as jest.Mock;

jest.mock("../apollo-cache/update-get-experiences-mini-query");
const mockFloatExperienceToTheTopInGetExperiencesMiniQuery = floatExperienceToTheTopInGetExperiencesMiniQuery as jest.Mock;

beforeEach(() => {
  jest.resetAllMocks();
});

const dataProxy = {} as DataProxy;

test("replaces experiene entry using entry.id offline", async () => {
  const experienceId = "ex";
  const entryId = "en";
  const newEntryClientId = "en1";

  const experience = {
    id: experienceId,
    entries: {
      edges: [
        {
          node: {
            id: entryId,
            clientId: entryId,
          },
        },
      ],
    },
  } as ExperienceFragment;

  mockReadGetExperienceFullQueryFromCache.mockReturnValue(experience);

  (await upsertExperienceWithEntry(experienceId, "offline")(dataProxy, {
    data: {
      createEntry: {
        entry: {
          id: entryId,
          clientId: newEntryClientId,
        },
      } as CreateOnlineEntryMutation_createEntry,
    },
  })) as ExperienceFragment;

  const mockWriteExperienceFragmentToCacheArg =
    mockWriteExperienceFragmentToCache.mock.calls[0][1];

  const edges = mockWriteExperienceFragmentToCacheArg.entries
    .edges as ExperienceFragment_entries_edges[];
  const node = edges[0].node as EntryFragment;
  expect(mockWriteExperienceFragmentToCacheArg.hasUnsaved).toBe(true);
  expect(edges).toHaveLength(1);
  expect(mockWriteExperienceFragmentToCacheArg.id).toBe(experienceId);
  expect(node.id).toBe(entryId);
  expect(node.clientId).toBe(newEntryClientId);

  expect(
    mockFloatExperienceToTheTopInGetExperiencesMiniQuery.mock.calls[0][1],
  ).toBe(mockWriteExperienceFragmentToCacheArg);
});

test("replaces entry using experience argument and entry.clientId while online", async () => {
  const experienceId = "ex";
  const onlineId = "enOn";
  const offlineId = "enOff";

  const experience = {
    id: experienceId,
    entries: {
      edges: [
        {
          node: {
            id: offlineId,
            clientId: offlineId,
          },
        },
      ],
    },
  } as ExperienceFragment;

  const mockOnDone = jest.fn();

  (await upsertExperienceWithEntry(
    experience,
    "online",
    mockOnDone,
  )(dataProxy, {
    data: {
      createEntry: {
        entry: {
          id: onlineId,
          clientId: offlineId,
        },
      } as CreateOnlineEntryMutation_createEntry,
    },
  })) as ExperienceFragment;

  const mockWriteExperienceFragmentToCacheArg =
    mockWriteExperienceFragmentToCache.mock.calls[0][1];

  const edges = mockWriteExperienceFragmentToCacheArg.entries
    .edges as ExperienceFragment_entries_edges[];
  const node = edges[0].node as EntryFragment;
  expect(mockWriteExperienceFragmentToCacheArg.hasUnsaved).toBeNull();
  expect(edges).toHaveLength(1);
  expect(mockWriteExperienceFragmentToCacheArg.id).toBe(experienceId);
  expect(node.id).toBe(onlineId);
  expect(node.clientId).toBe(offlineId);

  expect(
    mockFloatExperienceToTheTopInGetExperiencesMiniQuery.mock.calls[0][1],
  ).toBe(mockWriteExperienceFragmentToCacheArg);

  expect(mockOnDone).toHaveBeenCalled();
});

test("inserts entry if existing entry not found", async () => {
  const experienceId = "ex";
  const onlineId = "enOn";
  const offlineId = "enOff";

  const experience = {
    id: experienceId,
    entries: {},
  } as ExperienceFragment;

  mockReadGetExperienceFullQueryFromCache.mockReturnValue(experience);

  (await upsertExperienceWithEntry(experienceId, "online")(dataProxy, {
    data: {
      createEntry: {
        entry: {
          id: onlineId,
          clientId: offlineId,
        },
      } as CreateOnlineEntryMutation_createEntry,
    },
  })) as ExperienceFragment;

  const mockWriteExperienceFragmentToCacheArg =
    mockWriteExperienceFragmentToCache.mock.calls[0][1];

  const edges = mockWriteExperienceFragmentToCacheArg.entries
    .edges as ExperienceFragment_entries_edges[];
  const node = edges[0].node as EntryFragment;
  expect(mockWriteExperienceFragmentToCacheArg.hasUnsaved).toBeNull();
  expect(edges).toHaveLength(1);
  expect(mockWriteExperienceFragmentToCacheArg.id).toBe(experienceId);
  expect(node.id).toBe(onlineId);
  expect(node.clientId).toBe(offlineId);

  expect(
    mockFloatExperienceToTheTopInGetExperiencesMiniQuery.mock.calls[0][1],
  ).toBe(mockWriteExperienceFragmentToCacheArg);
});

test("with experience id, no entry", async () => {
  await upsertExperienceWithEntry("1", "online")(dataProxy, {});

  expect(mockWriteExperienceFragmentToCache).not.toHaveBeenCalled();
});

test("with experience id, experience does not exist", async () => {
  await upsertExperienceWithEntry("1", "online")(dataProxy, {
    data: {
      createEntry: { entry: {} },
    } as CreateOnlineEntryMutation,
  });

  expect(mockWriteExperienceFragmentToCache).not.toHaveBeenCalled();
});

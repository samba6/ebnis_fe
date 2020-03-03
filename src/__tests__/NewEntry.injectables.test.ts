import { DataProxy } from "apollo-cache";
import { upsertExperienceWithEntry } from "../components/NewEntry/new-entry.injectables";
import { readExperienceFragment } from "../apollo-cache/read-experience-fragment";
import {
  ExperienceFragment,
  ExperienceFragment_entries_edges,
} from "../graphql/apollo-types/ExperienceFragment";
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

test("replaces experience entry using entry.id offline", () => {
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

  upsertExperienceWithEntry(
    dataProxy,
    {
      id: entryId,
      clientId: newEntryClientId,
    } as EntryFragment,
    experienceId,
  ) as ExperienceFragment;

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

test("replaces entry using experience argument and entry.clientId while online", () => {
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

  upsertExperienceWithEntry(
    dataProxy,
    {
      id: onlineId,
      clientId: offlineId,
    } as EntryFragment,
    experience,
    mockOnDone,
  ) as ExperienceFragment;

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

test("inserts entry if existing entry not found", () => {
  const experienceId = "ex";
  const onlineId = "enOn";
  const offlineId = "enOff";

  const experience = {
    id: experienceId,
    entries: {},
  } as ExperienceFragment;

  mockReadGetExperienceFullQueryFromCache.mockReturnValue(experience);

  upsertExperienceWithEntry(
    dataProxy,
    {
      id: onlineId,
      clientId: offlineId,
    } as EntryFragment,
    experienceId,
  ) as ExperienceFragment;

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

test("with experience id, experience does not exist", () => {
  upsertExperienceWithEntry(dataProxy, {} as EntryFragment, "1");

  expect(mockWriteExperienceFragmentToCache).not.toHaveBeenCalled();
});

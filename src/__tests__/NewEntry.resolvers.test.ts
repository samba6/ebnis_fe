/* eslint-disable @typescript-eslint/no-explicit-any */

import { newEntryResolvers } from "../components/NewEntry/new-entry.resolvers";
import { CacheContext } from "../state/resolvers";
import { isOfflineId } from "../constants";
import { makeTestCache } from "./test_utils";
import { EntryFragment } from "../graphql/apollo-types/EntryFragment";
import { upsertExperienceWithEntry } from "../components/NewEntry/new-entry.injectables";
import { ExperienceFragment } from "../graphql/apollo-types/ExperienceFragment";
import { incrementOfflineEntriesCountForExperience } from "../apollo-cache/increment-offline-entries-count";

jest.mock("../components/NewEntry/new-entry.injectables");
jest.mock("../apollo-cache/increment-offline-entries-count");

const mockUpdateExperienceWithNewEntry = upsertExperienceWithEntry as jest.Mock;

const mockUpdateEntriesCountSavedAndUnsavedExperiencesInCache = incrementOfflineEntriesCountForExperience as jest.Mock;

const { createOfflineEntry } = newEntryResolvers.Mutation;

it("updates unsaved experience successfully", async () => {
  const { mockContext, mockUpdateExperienceWithNewEntryInnerFn } = setUp();

  const experienceId = "exp-1";

  const experience = {
    id: experienceId,
    clientId: "exp-1",
    entries: {},
  } as ExperienceFragment;

  const dataObject = {
    data: "2",
    definitionId: "3",
  };

  mockUpdateExperienceWithNewEntryInnerFn.mockResolvedValue({
    ...experience,
    entries: {
      edges: [
        {
          node: {
            experienceId,
            dataObjects: [dataObject],
          } as EntryFragment,
        },
      ],
    },
  });

  const {
    __typename,
    id,
    entry,
    experience: updatedExperience,
  } = await createOfflineEntry(
    {},
    { experience, dataObjects: [dataObject] },
    mockContext,
  );

  expect(isOfflineId(entry.id)).toBe(true);
  expect(entry.id).toBe(entry.clientId);
  expect(entry.id).toBe(id);
  expect(__typename).toEqual("Entry");

  const experienceEntry = (updatedExperience.entries.edges as any)[0].node;
  expect(entry).toMatchObject(experienceEntry);

  expect(
    mockUpdateEntriesCountSavedAndUnsavedExperiencesInCache,
  ).toHaveBeenCalled();
});

function setUp() {
  mockUpdateExperienceWithNewEntry.mockReset();

  const mockUpdateExperienceWithNewEntryInnerFn = jest.fn();

  mockUpdateExperienceWithNewEntry.mockReturnValue(
    mockUpdateExperienceWithNewEntryInnerFn,
  );

  const { cache, ...cacheProps } = makeTestCache();

  const mockContext = {
    cache: cache as any,
  } as CacheContext;

  return {
    mockContext,
    mockUpdateExperienceWithNewEntryInnerFn,
    ...cacheProps,
  };
}

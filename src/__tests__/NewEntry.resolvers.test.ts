// tslint:disable: no-any
import { newEntryResolvers } from "../components/NewEntry/resolvers";
import { CacheContext } from "../state/resolvers";
import { UnsavedExperience } from "../components/ExperienceDefinition/resolver-utils";
import { makeUnsavedId, UNSAVED_ID_PREFIX } from "../constants";
import { makeTestCache } from "./test_utils";

jest.mock("../components/NewEntry/update");

import { updateExperienceWithNewEntry } from "../components/NewEntry/update";

const mockUpdateExperienceWithNewEntry = updateExperienceWithNewEntry as jest.Mock;

const { createUnsavedEntry } = newEntryResolvers.Mutation;

it("updates unsaved experience successfully", async done => {
  const { mockContext } = setUp();

  mockUpdateExperienceWithNewEntry.mockResolvedValue({});

  const experienceId = makeUnsavedId("1");

  const experience = {
    id: experienceId,
    clientId: "exp-1",
    entries: {}
  } as UnsavedExperience;

  const field = {
    data: "2",
    defId: "3"
  };

  const {
    entry,
    experience: updatedExperience,
    savedExperiencesWithUnsavedEntries
  } = await createUnsavedEntry(
    {},
    { experience, fields: [field] },
    mockContext
  );

  expect(entry.id).toContain(UNSAVED_ID_PREFIX);
  expect(entry.id).toBe(entry.clientId);
  expect(entry).toMatchObject((updatedExperience.entries.edges as any)[0].node);

  expect(savedExperiencesWithUnsavedEntries).toBeNull();

  done();
});

it("inserts updated saved experience into the cache", async done => {
  const { mockContext, mockUpdateSavedExperience, mockReadQuery } = setUp();

  const experience = {
    id: "1"
  } as UnsavedExperience;

  mockUpdateSavedExperience.mockResolvedValue(experience);
  mockReadQuery.mockReturnValue(null);

  const { savedExperiencesWithUnsavedEntries } = await createUnsavedEntry(
    {},
    { experience, fields: [] },
    mockContext
  );

  expect(mockUpdateSavedExperience).toHaveBeenCalled();
  expect((savedExperiencesWithUnsavedEntries as any)[0]).toEqual(experience);

  done();
});

it("updates updated saved experience into the cache", async done => {
  const { mockContext, mockUpdateSavedExperience, mockReadQuery } = setUp();

  const experience1 = {
    id: "1"
  } as UnsavedExperience;

  const experience2 = {
    id: "2"
  } as UnsavedExperience;

  const experience3 = {
    id: "3"
  } as UnsavedExperience;

  const experience2Updated = { ...experience2, entries: {} };

  mockUpdateSavedExperience.mockResolvedValue(experience2Updated);
  mockReadQuery.mockReturnValue({
    savedExperiencesWithUnsavedEntries: [experience1, experience2, experience3]
  });

  const { savedExperiencesWithUnsavedEntries } = await createUnsavedEntry(
    {},
    { experience: experience2, fields: [] },
    mockContext
  );

  expect(mockUpdateSavedExperience).toHaveBeenCalled();
  expect((savedExperiencesWithUnsavedEntries as any)[1]).toEqual(
    experience2Updated
  );

  done();
});

function setUp() {
  mockUpdateExperienceWithNewEntry.mockReset();

  const mockUpdateSavedExperience = jest.fn();

  mockUpdateExperienceWithNewEntry.mockReturnValue(mockUpdateSavedExperience);

  const mockGetCacheKey = jest.fn();

  const { cache, ...cacheProps } = makeTestCache();

  const mockContext = {
    cache: cache as any,
    getCacheKey: mockGetCacheKey as any
  } as CacheContext;

  return {
    mockContext,
    mockGetCacheKey,
    mockUpdateSavedExperience,
    ...cacheProps
  };
}

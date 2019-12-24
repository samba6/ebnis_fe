/* eslint-disable @typescript-eslint/no-explicit-any */

import { newEntryResolvers } from "../components/NewEntry/new-entry.resolvers";
import { CacheContext } from "../state/resolvers";
import { isUnsavedId } from "../constants";
import { makeTestCache } from "./test_utils";
import { EntryFragment } from "../graphql/apollo-types/EntryFragment";
import { updateExperienceWithNewEntry } from "../components/NewEntry/new-entry.injectables";
import { ExperienceFragment } from "../graphql/apollo-types/ExperienceFragment";
import { updateEntriesCountSavedAndUnsavedExperiencesInCache } from "../state/resolvers/update-saved-and-unsaved-experiences-in-cache";

jest.mock("../components/NewEntry/new-entry.injectables");
jest.mock("../state/resolvers/update-saved-and-unsaved-experiences-in-cache");

const mockUpdateExperienceWithNewEntry = updateExperienceWithNewEntry as jest.Mock;

const mockUpdateEntriesCountSavedAndUnsavedExperiencesInCache = updateEntriesCountSavedAndUnsavedExperiencesInCache as jest.Mock;

const { createEntryOffline } = newEntryResolvers.Mutation;

it("updates unsaved experience successfully", async done => {
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
  } = await createEntryOffline(
    {},
    { experience, dataObjects: [dataObject] },
    mockContext,
  );

  expect(isUnsavedId(entry.id)).toBe(true);
  expect(entry.id).toBe(entry.clientId);
  expect(entry.id).toBe(id);
  expect(__typename).toEqual("Entry");

  const experienceEntry = (updatedExperience.entries.edges as any)[0].node;
  expect(entry).toMatchObject(experienceEntry);

  expect(
    mockUpdateEntriesCountSavedAndUnsavedExperiencesInCache,
  ).toHaveBeenCalled();

  done();
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

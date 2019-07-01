/* eslint-disable @typescript-eslint/no-explicit-any */

import { newEntryResolvers } from "../components/NewEntry/resolvers";
import { CacheContext } from "../state/resolvers";
import { isUnsavedId } from "../constants";
import { makeTestCache } from "./test_utils";

jest.mock("../components/NewEntry/update");

import { updateExperienceWithNewEntry } from "../components/NewEntry/update";
import { ExperienceFragment } from "../graphql/apollo-types/ExperienceFragment";

const mockUpdateExperienceWithNewEntry = updateExperienceWithNewEntry as jest.Mock;

const { createUnsavedEntry } = newEntryResolvers.Mutation;

it("updates unsaved experience successfully", async done => {
  const { mockContext, mockUpdateExperienceWithNewEntryInnerFn } = setUp();

  const experienceId = "exp-1";

  const experience = {
    id: experienceId,
    clientId: "exp-1",
    entries: {},
  } as ExperienceFragment;

  const field = {
    data: "2",
    defId: "3",
  };

  mockUpdateExperienceWithNewEntryInnerFn.mockResolvedValue({
    ...experience,
    entries: {
      edges: [
        {
          node: {
            expId: experienceId,
            fields: [field],
          },
        },
      ],
    },
  });

  const {
    __typename,
    id,
    entry,
    experience: updatedExperience,
  } = await createUnsavedEntry(
    {},
    { experience, fields: [field] },
    mockContext,
  );

  expect(isUnsavedId(entry.id)).toBe(true);
  expect(entry.id).toBe(entry.clientId);
  expect(entry.id).toBe(id);
  expect(__typename).toEqual("Entry");

  const experienceEntry = (updatedExperience.entries.edges as any)[0].node;
  expect(entry).toMatchObject(experienceEntry);

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

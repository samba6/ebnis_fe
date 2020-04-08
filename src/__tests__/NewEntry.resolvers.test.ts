/* eslint-disable @typescript-eslint/no-explicit-any */
import { newEntryResolvers } from "../components/NewEntry/new-entry.resolvers";
import { CacheContext } from "../state/resolvers";
import { makeTestCache } from "./test_utils";
import { ExperienceFragment } from "../graphql/apollo-types/ExperienceFragment";

jest.mock("../apollo-cache/write-experience-fragment");
jest.mock("../components/NewEntry/new-entry.injectables");

const { createOfflineEntry } = newEntryResolvers.Mutation;

it("updates experience with new entry", () => {
  const { mockContext } = setUp();

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

  const { __typename, id, entry } = createOfflineEntry(
    {},
    { experienceId: experience.id, dataObjects: [dataObject] },
    mockContext,
  );

  expect(entry.id).toBe(entry.clientId);
  expect(entry.id).toBe(id);
  expect(__typename).toEqual("Entry");
});

function setUp() {
  const { cache, ...cacheProps } = makeTestCache();

  const mockContext = {
    cache: cache as any,
  } as CacheContext;

  return {
    mockContext,
    ...cacheProps,
  };
}

import { DataProxy } from "apollo-cache";
import { upsertExperienceWithEntry } from "../components/NewEntry/new-entry.injectables";
import { readExperienceFragment } from "../apollo-cache/read-experience-fragment";
import {
  ExperienceFragment,
  ExperienceFragment_entries_edges,
} from "../graphql/apollo-types/ExperienceFragment";
import { CreateOnlineEntryMutation_createEntry } from "../graphql/apollo-types/CreateOnlineEntryMutation";
import { EntryFragment } from "../graphql/apollo-types/EntryFragment";

jest.mock("../state/resolvers/write-get-experience-full-query-to-cache");

jest.mock("../apollo-cache/read-experience-fragment");
const mockReadGetExperienceFullQueryFromCache = readExperienceFragment as jest.Mock;

beforeEach(() => {
  mockReadGetExperienceFullQueryFromCache.mockReset();
});

test("replaces experiene entry", async () => {
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

  const result = (await upsertExperienceWithEntry(experienceId, "offline")(
    {} as DataProxy,
    {
      data: {
        createEntry: {
          entry: {
            id: entryId,
            clientId: newEntryClientId,
          },
        } as CreateOnlineEntryMutation_createEntry,
      },
    },
  )) as ExperienceFragment;

  const edges = result.entries.edges as ExperienceFragment_entries_edges[];
  const node = edges[0].node as EntryFragment;
  expect(result.hasUnsaved).toBe(true);
  expect(edges).toHaveLength(1);
  expect(result.id).toBe(experienceId);
  expect(node.id).toBe(entryId);
  expect(node.clientId).toBe(newEntryClientId);
});

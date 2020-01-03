import { DataProxy } from "apollo-cache";
import { updateExperienceWithEntry } from "../components/NewEntry/new-entry.injectables";
import { readGetExperienceFullQueryFromCache } from "../state/resolvers/read-get-experience-full-query-from-cache";
import {
  ExperienceFragment,
  ExperienceFragment_entries_edges,
} from "../graphql/apollo-types/ExperienceFragment";
import { CreateOnlineEntryMutation_createEntry } from "../graphql/apollo-types/CreateOnlineEntryMutation";
import { EntryFragment } from "../graphql/apollo-types/EntryFragment";

jest.mock("../state/resolvers/write-get-experience-full-query-to-cache");

jest.mock("../state/resolvers/read-get-experience-full-query-from-cache");
const mockReadGetExperienceFullQueryFromCache = readGetExperienceFullQueryFromCache as jest.Mock;

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

  const result = await updateExperienceWithEntry(experienceId)(
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
  );

  const edges = result.entries.edges;
  const node = (edges[0] as ExperienceFragment_entries_edges)
    .node as EntryFragment;
  expect(edges).toHaveLength(1);

  expect(result.id).toBe(experienceId);
  expect(node.id).toBe(entryId);
  expect(node.clientId).toBe(newEntryClientId);
});

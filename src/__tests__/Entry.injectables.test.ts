import { EntryFragment } from "../graphql/apollo-types/EntryFragment";
import { makeOfflineId } from "../constants";
import { getOnlineStatus } from "../components/Entry/entry.injectables";
import { getUnsyncedExperience } from "../apollo-cache/unsynced.resolvers";

jest.mock("../apollo-cache/unsynced.resolvers");
const mockGetUnsyncedExperience = getUnsyncedExperience as jest.Mock;

test("getOnlineState", () => {
  const entry = { id: makeOfflineId("") } as EntryFragment;

  expect(getOnlineStatus(entry)).toEqual({
    isOffline: true,
    isOnline: false,
    isPartOffline: false,
  });

  entry.id = "a";

  expect(getOnlineStatus(entry)).toEqual({
    isOffline: false,
    isOnline: true,
    isPartOffline: false,
  });

  mockGetUnsyncedExperience.mockReturnValue({});

  expect(getOnlineStatus(entry)).toEqual({
    isOffline: false,
    isOnline: true,
    isPartOffline: false,
  });

  mockGetUnsyncedExperience.mockReturnValue({
    modifiedEntries: {},
  });

  expect(getOnlineStatus(entry)).toEqual({
    isOffline: false,
    isOnline: true,
    isPartOffline: false,
  });

  mockGetUnsyncedExperience.mockReturnValue({
    modifiedEntries: { a: true },
  });

  expect(getOnlineStatus(entry)).toEqual({
    isOffline: false,
    isOnline: false,
    isPartOffline: true,
  });
});

/* eslint-disable @typescript-eslint/no-explicit-any*/
import { DataProxy } from "apollo-cache";
import { editEntryUpdate } from "../components/EditEntry/edit-entry.injectables";
import { upsertExperienceWithEntry } from "../components/NewEntry/new-entry.injectables";
import { EntryFragment } from "../graphql/apollo-types/EntryFragment";
import { UpdateDataObjects_updateDataObjects } from "../graphql/apollo-types/UpdateDataObjects";

jest.mock("../components/NewEntry/new-entry.injectables");
const mockUpsertExperienceWithEntry = upsertExperienceWithEntry as jest.Mock;
const mockUpsertExperienceWithEntryFn = jest.fn();

beforeEach(() => {
  jest.resetAllMocks();

  mockUpsertExperienceWithEntry.mockReturnValue(
    mockUpsertExperienceWithEntryFn,
  );
});

const dataProxy = {} as DataProxy;

test("no update because no updatedDataObjects", () => {
  editEntryUpdate({} as EntryFragment)(dataProxy, {});
  expect(mockUpsertExperienceWithEntry).not.toHaveBeenCalled();
});

test("no update because no data object in update results", () => {
  editEntryUpdate({} as EntryFragment)(dataProxy, {
    data: {
      updateDataObjects: [{} as UpdateDataObjects_updateDataObjects],
    },
  });
  expect(mockUpsertExperienceWithEntry).not.toHaveBeenCalled();
});

test("updated", () => {
  editEntryUpdate({
    experienceId: "ex",
    dataObjects: [
      {
        id: "1",
        data: "1",
      },
      {
        id: "2",
      },
    ],
  } as EntryFragment)(dataProxy, {
    data: {
      updateDataObjects: [
        {
          id: "1",
          dataObject: {
            id: "1",
            data: "2",
          },
        } as UpdateDataObjects_updateDataObjects,
      ],
    },
  });

  expect(mockUpsertExperienceWithEntry.mock.calls[0]).toEqual(["ex", "online"]);

  const mockUpsertExperienceWithEntryFnArgs = mockUpsertExperienceWithEntryFn
    .mock.calls[0][1] as any;

  expect(
    mockUpsertExperienceWithEntryFnArgs.data.createEntry.entry.dataObjects,
  ).toEqual([
    {
      id: "1",
      data: "2",
    },
    {
      id: "2",
    },
  ]);
});

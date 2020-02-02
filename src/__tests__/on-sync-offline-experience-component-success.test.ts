/* eslint-disable @typescript-eslint/no-explicit-any*/
import { EbnisContextProps } from "../context";
import { replaceExperiencesInGetExperiencesMiniQuery } from "../apollo-cache/update-get-experiences-mini-query";
import { wipeReferencesFromCache } from "../state/resolvers/delete-references-from-cache";
import {
  execOnSyncOfflineExperienceComponentSuccess,
  saveOnSyncOfflineExperienceComponentSuccess,
} from "../apollo-cache/on-sync-offline-experience-component-success";
import { makeExperienceRoute } from "../constants/experience-route";

jest.mock("../apollo-cache/update-get-experiences-mini-query");
const mockReplaceExperiencesInGetExperiencesMiniQuery = replaceExperiencesInGetExperiencesMiniQuery as jest.Mock;

jest.mock("../state/resolvers/delete-references-from-cache");
const mockWipeReferencesFromCache = wipeReferencesFromCache as jest.Mock;

const mockOnMatchUrl = jest.fn();
const mockGetItem = jest.fn();
const mockSetItem = jest.fn();
const mockRemoveItem = jest.fn();
const mockPersistFunc = jest.fn();
const mockLocationReplace = jest.fn();

Object.defineProperty(window, "localStorage", {
  value: {
    getItem: mockGetItem as any,
    setItem: mockSetItem,
    removeItem: mockRemoveItem,
  },
});

const originalWindowLocation = window.location;

beforeEach(() => {
  jest.resetAllMocks();
  delete window.location;
  window.location = { replace: mockLocationReplace } as any;
});

afterEach(() => {
  window.location = originalWindowLocation;
});

const cacheThings = {
  persistor: {
    persist: mockPersistFunc as any,
  },
} as EbnisContextProps;

const url = makeExperienceRoute("3");
const ids = ["1", "2", "3"];
const jsonIds = JSON.stringify(ids);

test("saveOnSyncOfflineExperienceComponentSuccess", () => {
  saveOnSyncOfflineExperienceComponentSuccess(ids);
  expect(mockSetItem.mock.calls[0][1]).toBe(jsonIds);
  expect(mockLocationReplace.mock.calls[0][0]).toBe(url);
});

describe("execOnSyncOfflineExperienceComponentSuccess", () => {
  test("no op", () => {
    mockGetItem.mockReturnValue(null);

    execOnSyncOfflineExperienceComponentSuccess(
      "",
      mockOnMatchUrl,
      cacheThings,
    );

    expect(
      mockReplaceExperiencesInGetExperiencesMiniQuery,
    ).not.toHaveBeenCalled();

    expect(mockWipeReferencesFromCache).not.toHaveBeenCalled();
  });

  test("no matched url", () => {
    mockGetItem.mockReturnValue(jsonIds);

    execOnSyncOfflineExperienceComponentSuccess(
      "",
      mockOnMatchUrl,
      cacheThings,
    );

    expect(
      mockReplaceExperiencesInGetExperiencesMiniQuery.mock.calls[0][1],
    ).toEqual({
      "1": null,
    });

    expect(mockWipeReferencesFromCache.mock.calls[0][1]).toEqual(["1", "2"]);
    expect(mockRemoveItem).toHaveBeenCalled();
    expect(mockPersistFunc).toHaveBeenCalled();
    expect(mockOnMatchUrl).not.toHaveBeenCalled();
  });

  test("matched url", () => {
    mockGetItem.mockReturnValue(jsonIds);

    execOnSyncOfflineExperienceComponentSuccess(
      url,
      mockOnMatchUrl,
      cacheThings,
    );

    expect(mockOnMatchUrl).toHaveBeenCalled();
  });
});

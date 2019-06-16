// tslint:disable: no-any
import React, { ComponentType } from "react";
import "jest-dom/extend-expect";
import "react-testing-library/cleanup-after-each";
import {
  render,
  fireEvent,
  wait,
  getByText as getDescendantByText,
  getByTestId as getDescendantByTestId
} from "react-testing-library";
import isDateWithinRange from "date-fns/is_within_range";
import addHours from "date-fns/add_hours";
import addDays from "date-fns/add_days";
import formatDate from "date-fns/format";
import differenceInDays from "date-fns/difference_in_days";
import differenceInHours from "date-fns/difference_in_hours";

import { NewEntry } from "../components/NewEntry/component";
import { Props } from "../components/NewEntry/utils";
import { renderWithRouter, fillField, makeTestCache } from "./test_utils";
import {
  GetAnExp_exp,
  GetAnExp_exp_entries
} from "../graphql/apollo-types/GetAnExp";
import { FieldType } from "../graphql/apollo-types/globalTypes";

jest.mock("../components/NewEntry/update");
jest.mock("../components/SidebarHeader", () => ({
  SidebarHeader: jest.fn(() => null)
}));
jest.mock("../state/get-conn-status");

import { updateExperienceWithNewEntry } from "../components/NewEntry/update";
import { getConnStatus } from "../state/get-conn-status";
import { newEntryResolvers } from "../components/NewEntry/resolvers";
import { CacheContext } from "../state/resolvers";
import { UnsavedExperience } from "../components/ExperienceDefinition/resolver-utils";
import { makeUnsavedId, UNSAVED_ID_PREFIX } from "../constants";

describe("component", () => {
  const mockGetConnStatus = getConnStatus as jest.Mock;
  const mockUpdate = updateExperienceWithNewEntry as jest.Mock;

  type P = ComponentType<Partial<Props>>;
  const NewEntryP = NewEntry as P;
  const title = "what lovely experience";

  it("creates new experience entry when online", async () => {
    // an hour earlier
    const now = addHours(new Date(), -1);

    // we will check that date submitted to server is between yesterday
    // and today
    const startDate = addDays(now, -1);
    const endDate = addDays(startDate, 2);

    // we will check that datetime submitted to server is within an hour from now
    const endDatetime = addHours(now, 2);

    /**
     * Given we have received experiences from server
     */
    const exp = {
      id: "1000",

      title,

      fieldDefs: [
        { id: "f1", name: "f1", type: FieldType.DATE, __typename: "FieldDef" },

        {
          id: "f2",
          name: "f2",
          type: FieldType.DATETIME,
          __typename: "FieldDef"
        },

        {
          id: "f3",
          name: "f3",
          type: FieldType.DECIMAL,
          __typename: "FieldDef"
        },

        {
          id: "f4",
          name: "f4",
          type: FieldType.INTEGER,
          __typename: "FieldDef"
        },

        {
          id: "f5",
          name: "f5",
          type: FieldType.SINGLE_LINE_TEXT,
          __typename: "FieldDef"
        },

        {
          id: "f6",
          name: "f6",
          type: FieldType.MULTI_LINE_TEXT,
          __typename: "FieldDef"
        }
      ],

      description: "lovely",

      __typename: "Experience",

      entries: {} as GetAnExp_exp_entries
    } as GetAnExp_exp;

    const { ui, mockCreateEntry } = makeComp({
      experience: exp
    });

    /**
     * While we are on new entry page
     */
    const { queryByTestId, getByLabelText, getByText } = render(ui);

    /**
     * Then we should not see loading indicator
     */
    expect(queryByTestId("loading-spinner")).not.toBeInTheDocument();

    /**
     * And SINGLE_LINE_TEXT field should be empty
     */
    const $singleText = getByLabelText(
      "f5 [SINGLE_LINE_TEXT]"
    ) as HTMLInputElement;

    expect($singleText.value).toBe("");

    /**
     * And MULTI_LINE_TEXT field should be empty
     */
    const $multiText = getByLabelText(
      "f6 [MULTI_LINE_TEXT]"
    ) as HTMLInputElement;

    expect($multiText.value).toBe("");

    /**
     * And DECIMAL field should be empty
     */
    const $decimal = getByLabelText("f3 [DECIMAL]") as HTMLInputElement;

    expect($decimal.value).toBe("");

    /**
     * And INTEGER field should be empty
     */
    const $integer = getByLabelText("f4 [INTEGER]") as HTMLInputElement;

    expect($integer.value).toBe("");

    /**
     * When we complete and submit the form
     */
    fillField($integer, "1");
    fillField($decimal, "2.0");
    fillField($multiText, "m");
    fillField($singleText, "s");

    fireEvent.click(getByText(/submit/i));

    /**
     * Then the correct values should be sent to the server
     */
    await wait(() => {
      const {
        variables: {
          entry: { expId, fields }
        }
      } = mockCreateEntry.mock.calls[0][0] as any;

      expect(expId).toBe("1000");
      expect((mockUpdate as jest.Mock).mock.calls[0][0]).toBe("1000");

      const [f1, f2, f3, f4, f5, f6] = fields;

      expect(f1.defId).toBe("f1");
      expect(
        isDateWithinRange(JSON.parse(f1.data).date, startDate, endDate)
      ).toBe(true);

      expect(f2.defId).toBe("f2");
      expect(
        isDateWithinRange(JSON.parse(f2.data).datetime, now, endDatetime)
      ).toBe(true);

      expect(f3.defId).toBe("f3");
      expect(JSON.parse(f3.data).decimal).toBe("2");

      expect(f4.defId).toBe("f4");
      expect(JSON.parse(f4.data).integer).toBe("1");

      expect(f5.defId).toBe("f5");
      expect(JSON.parse(f5.data).single_line_text).toBe("s");

      expect(f6.defId).toBe("f6");
      expect(JSON.parse(f6.data).multi_line_text).toBe("m");
    });
  });

  it("sets decimal and integer fields to default to 0", async () => {
    /**
     * Given we have received experiences from server
     */
    const exp = {
      fieldDefs: [
        {
          id: "f1",
          name: "f3",
          type: FieldType.DECIMAL,
          __typename: "FieldDef"
        },

        {
          id: "f2",
          name: "f4",
          type: FieldType.INTEGER,
          __typename: "FieldDef"
        }
      ]
    } as GetAnExp_exp;

    const { ui, mockCreateEntry } = makeComp({
      experience: exp
    });

    /**
     * While we are on new entry page
     */
    const { getByText } = render(ui);

    /**
     * When we submit the form without making any input
     */
    fireEvent.click(getByText(/submit/i));

    /**
     * Then default values should be sent to the server
     */
    await wait(() => {
      const {
        variables: {
          entry: { fields }
        }
      } = mockCreateEntry.mock.calls[0][0] as any;

      const [f1, f2] = fields;

      expect(JSON.parse(f1.data).decimal).toBe("0");

      expect(JSON.parse(f2.data).integer).toBe("0");
    });
  });

  it("sets values of date and datetime fields", async () => {
    const now = new Date();

    /**
     * Given we have received experiences from server
     */
    const exp = {
      id: "1000",

      title,

      fieldDefs: [
        { id: "f1", name: "f1", type: FieldType.DATE, __typename: "FieldDef" },

        {
          id: "f2",
          name: "f2",
          type: FieldType.DATETIME,
          __typename: "FieldDef"
        }
      ],

      description: "lovely",

      __typename: "Experience",

      entries: {} as GetAnExp_exp_entries
    } as GetAnExp_exp;

    const { ui, mockCreateEntry } = makeComp({
      experience: exp
    });

    /**
     * While we are on new entry page
     */
    const { getByText, getByTestId } = render(ui);

    /**
     * When we change datetime field to 2 hours ago
     */
    const datetime = addHours(now, -2);

    const [y, m, d, h, mi] = formatDate(datetime, "YYYY MMM D HH mm").split(
      " "
    );
    const $datetimeField = getByTestId("datetime-field-fields[1]");
    fireEvent.click(getDescendantByText($datetimeField, y));
    fireEvent.click(getDescendantByText($datetimeField, m));
    fireEvent.click(getDescendantByText($datetimeField, d));
    fireEvent.click(
      getDescendantByText(
        getDescendantByTestId($datetimeField, "fields[1].hr"),
        h
      )
    );
    fireEvent.click(
      getDescendantByText(
        getDescendantByTestId($datetimeField, "fields[1].min"),
        mi
      )
    );

    /**
     * And we change date to 2 days ago
     */
    const date = addDays(now, -2);
    const [y1, m1, d1] = formatDate(date, "YYYY MMM D").split(" ");
    const $dateField = getByTestId("date-field-fields[0]");
    fireEvent.click(getDescendantByText($dateField, y1));
    fireEvent.click(getDescendantByText($dateField, m1));
    fireEvent.click(getDescendantByText($dateField, d1));

    /**
     * And submit the form
     */
    fireEvent.click(getByText(/submit/i));

    /**
     * Then the correct values should be sent to the server
     */
    await wait(() => {
      const {
        variables: {
          entry: { fields }
        }
      } = mockCreateEntry.mock.calls[0][0] as any;

      const [f1, f2] = fields;

      expect(differenceInDays(now, JSON.parse(f1.data).date)).toBe(2);
      expect(
        differenceInHours(now, JSON.parse(f2.data).datetime)
      ).toBeGreaterThanOrEqual(1);
    });
  });

  it("creates new experience entry when offline", async () => {
    /**
     * Given we have received experiences from server
     */
    const exp = {
      id: "1000",

      title,

      fieldDefs: [
        {
          id: "f1",
          name: "f1",
          type: FieldType.SINGLE_LINE_TEXT,
          __typename: "FieldDef"
        }
      ],

      entries: {}
    };

    const { ui, mockCreateUnsavedEntry, mockCreateEntry } = makeComp(
      {
        experience: exp as any
      },
      false
    );

    /**
     * While we are on new entry page
     */
    const { queryByTestId, getByLabelText, getByText } = render(ui);

    /**
     * Then we should not see loading indicator
     */
    expect(queryByTestId("loading-spinner")).not.toBeInTheDocument();

    /**
     * When we complete and submit the form
     */
    const $singleText = getByLabelText(
      "f1 [SINGLE_LINE_TEXT]"
    ) as HTMLInputElement;

    fillField($singleText, "s");

    fireEvent.click(getByText(/submit/i));

    /**
     * Then the correct values should be saved locally
     */
    await wait(() => {
      const {
        variables: { experience, fields }
      } = mockCreateUnsavedEntry.mock.calls[0][0] as any;

      expect(experience.id).toBe("1000");

      const [f1] = fields;

      expect(f1.defId).toBe("f1");
      expect(JSON.parse(f1.data).single_line_text).toBe("s");
    });

    /**
     * No values should be uploaded to the server
     */
    expect(mockCreateEntry).not.toBeCalled();
  });

  function makeComp(props: Partial<Props>, connectionStatus: boolean = true) {
    mockGetConnStatus.mockReset();
    mockGetConnStatus.mockResolvedValue(connectionStatus);
    mockUpdate.mockReset();
    const mockCreateEntry = jest.fn();
    const mockCreateUnsavedEntry = jest.fn();

    const { Ui, ...rest } = renderWithRouter(NewEntryP);

    return {
      ui: (
        <Ui
          createEntry={mockCreateEntry}
          createUnsavedEntry={mockCreateUnsavedEntry}
          {...props}
        />
      ),
      mockCreateEntry,
      mockCreateUnsavedEntry,
      ...rest
    };
  }
});

describe("resolvers", () => {
  const mockUpdateExperienceWithNewEntry = updateExperienceWithNewEntry as jest.Mock;

  describe("createUnsavedEntryResolver", () => {
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
        unsavedEntriesSavedExperiences
      } = await createUnsavedEntry(
        {},
        { experience, fields: [field] },
        mockContext
      );

      expect(entry.id).toContain(UNSAVED_ID_PREFIX);
      expect(entry.id).toBe(entry.clientId);
      expect(entry).toMatchObject(
        (updatedExperience.entries.edges as any)[0].node
      );

      expect(unsavedEntriesSavedExperiences).toBeNull();

      done();
    });

    it("inserts updated saved experience into the cache", async done => {
      const { mockContext, mockUpdateSavedExperience, mockReadQuery } = setUp();

      const experience = {
        id: "1"
      } as UnsavedExperience;

      mockUpdateSavedExperience.mockResolvedValue(experience);
      mockReadQuery.mockReturnValue(null);

      const { unsavedEntriesSavedExperiences } = await createUnsavedEntry(
        {},
        { experience, fields: [] },
        mockContext
      );

      expect(mockUpdateSavedExperience).toHaveBeenCalled();
      expect((unsavedEntriesSavedExperiences as any)[0]).toEqual(experience);

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
        unsavedEntriesSavedExperiences: [experience1, experience2, experience3]
      });

      const { unsavedEntriesSavedExperiences } = await createUnsavedEntry(
        {},
        { experience: experience2, fields: [] },
        mockContext
      );

      expect(mockUpdateSavedExperience).toHaveBeenCalled();
      expect((unsavedEntriesSavedExperiences as any)[1]).toEqual(
        experience2Updated
      );

      done();
    });
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
});

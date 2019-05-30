// tslint:disable: no-any
import React, { ComponentType } from "react";
import "jest-dom/extend-expect";
import "react-testing-library/cleanup-after-each";
import { render } from "react-testing-library";

import { Experience } from "../components/Experience/component";
import { Props } from "../components/Experience/utils";
import { GetExpAllEntries_expEntries } from "../graphql/apollo-types/GetExpAllEntries";
import { GetExpEntriesGqlValue } from "../graphql/exp-entries.query";
import { FieldType } from "../graphql/apollo-types/globalTypes";
import { GetAnExp_exp_fieldDefs } from "../graphql/apollo-types/GetAnExp";
import { GetExperienceGqlValues } from "../graphql/get-exp.query";

jest.mock("../components/SidebarHeader", () => ({
  SidebarHeader: jest.fn(() => null)
}));

type P = ComponentType<Partial<Props>>;
const ExperienceP = Experience as P;

it("renders loading while getting experience", () => {
  /**
   * Given that server has not returned experience to us
   */
  const { ui } = makeComp({
    getExperienceGql: { loading: true } as any
  });

  /**
   * While using the component
   */
  const { getByTestId } = render(ui);

  /**
   * Then we should see loading indicator
   */
  expect(getByTestId("loading-spinner")).toBeInTheDocument();
});

it("renders loading while getting entries", () => {
  /**
   * Given that server has not returned entries to us
   */
  const { ui } = makeComp({
    experienceEntries: { loading: true } as any
  });

  /**
   * While using the component
   */
  const { getByTestId, queryByText } = render(ui);

  /**
   * Then we should see loading indicator
   */
  expect(getByTestId("loading-spinner")).toBeInTheDocument();

  /**
   * And we should not see texts that there not entries
   */
  expect(
    queryByText("No entries. Click here to add one")
  ).not.toBeInTheDocument();
});

it("renders ui to show empty entries", () => {
  /**
   * Given that there is experience with no entry in the system
   */
  const { ui } = makeComp();

  /**
   * When we use the component
   */
  const { queryByTestId, getByText } = render(ui);

  /**
   * Then we should not see loading spinner
   */
  expect(queryByTestId("loading-spinner")).not.toBeInTheDocument();

  /**
   * And we should see texts informing us that there are not entries
   */
  expect(getByText("No entries. Click here to add one")).toBeInTheDocument();

  /**
   * And we should not see any UI for an entry
   */
  expect(queryByTestId("experience-entry")).not.toBeInTheDocument();
});

it("renders entries", () => {
  /**
   * Given that experience and associated entries exist in the system
   */
  const expEntries = [
    {
      id: "1",
      fields: [
        {
          defId: "1",
          data: JSON.stringify({
            [FieldType.SINGLE_LINE_TEXT]: "cat man 1"
          })
        }
      ]
    },

    {
      id: "2",
      fields: [
        {
          defId: "2",
          data: JSON.stringify({
            [FieldType.MULTI_LINE_TEXT]: "cat man 2"
          })
        }
      ]
    },

    {
      id: "3",
      fields: [
        {
          defId: "3",
          data: JSON.stringify({
            [FieldType.DATE]: "2019-05-01"
          })
        }
      ]
    },

    {
      id: "4",
      fields: [
        {
          defId: "4",
          data: JSON.stringify({
            [FieldType.DATETIME]: "2019-05-01"
          })
        }
      ]
    },

    {
      id: "5",
      fields: [
        {
          defId: "5",
          data: JSON.stringify({
            [FieldType.DECIMAL]: "500.689"
          })
        }
      ]
    },

    {
      id: "6",
      fields: [
        {
          defId: "6",
          data: JSON.stringify({
            [FieldType.INTEGER]: "567012"
          })
        }
      ]
    }
  ] as GetExpAllEntries_expEntries[];

  const fieldDefs = [
    {
      id: "1",
      name: "field name 1",
      type: FieldType.SINGLE_LINE_TEXT
    },

    {
      id: "2",
      name: "field name 2",
      type: FieldType.MULTI_LINE_TEXT
    },

    {
      id: "3",
      name: "field name 3",
      type: FieldType.DATE
    },

    {
      id: "4",
      name: "field name 4",
      type: FieldType.DATETIME
    },

    {
      id: "5",
      name: "field name 5",
      type: FieldType.DECIMAL
    },

    {
      id: "6",
      name: "field name 6",
      type: FieldType.INTEGER
    }
  ] as GetAnExp_exp_fieldDefs[];

  const { ui } = makeComp({
    experienceEntries: {
      expEntries
    } as GetExpEntriesGqlValue,

    getExperienceGql: {
      exp: {
        fieldDefs
      }
    } as GetExperienceGqlValues
  });

  /**
   * When we start using the component
   */
  const { queryByText, getByText } = render(ui);

  /**
   * Then we should not see text informing us there are not entries (of course
   * we have several)
   */
  expect(
    queryByText("No entries. Click here to add one")
  ).not.toBeInTheDocument();

  /**
   * And we should see the entries' field names and associated data
   */
  expect(getByText(/field name 1/)).toBeInTheDocument();
  expect(getByText(/cat man 1/)).toBeInTheDocument();

  expect(getByText(/field name 2/)).toBeInTheDocument();
  expect(getByText(/cat man 2/)).toBeInTheDocument();

  expect(getByText(/field name 3/)).toBeInTheDocument();
  expect(getByText(/field name 4/)).toBeInTheDocument();
  expect(getByText(/field name 5/)).toBeInTheDocument();
  expect(getByText(/field name 6/)).toBeInTheDocument();
});

function makeComp(props: Partial<Props> = {}) {
  return {
    ui: (
      <ExperienceP
        getExperienceGql={{ exp: {} } as any}
        experienceEntries={{ expEntries: [] } as any}
        {...props}
      />
    )
  };
}

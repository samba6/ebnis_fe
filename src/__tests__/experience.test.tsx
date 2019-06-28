// tslint:disable: no-any
import React, { ComponentType } from "react";
import "jest-dom/extend-expect";
import "react-testing-library/cleanup-after-each";
import { render } from "react-testing-library";

import { Experience } from "../components/Experience/component";
import { Props } from "../components/Experience/utils";
import { FieldType } from "../graphql/apollo-types/globalTypes";
import {} from "../graphql/apollo-types/GetExperienceFull";
import { renderWithRouter } from "./test_utils";
import {
  ExperienceFragment_entries_edges,
  ExperienceFragment_fieldDefs
} from "../graphql/apollo-types/ExperienceFragment";

jest.mock("../components/SidebarHeader", () => ({
  SidebarHeader: jest.fn(() => null)
}));

const ExperienceP = Experience as P;

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.clearAllTimers();
});

it("renders ui to show empty entries", () => {
  /**
   * Given that there is experience with no entry in the system
   */
  const { ui } = makeComp({
    experience: {
      entries: {
        edges: []
      }
    } as any
  });

  /**
   * When we use the component
   */
  const { queryByTestId } = render(ui);

  /**
   * Then we should not see loading spinner
   */
  expect(queryByTestId("loading-spinner")).not.toBeInTheDocument();

  /**
   * And we should see texts informing us that there are no entries
   */
  expect(queryByTestId("no-entries")).toBeInTheDocument();

  /**
   * And we should not see any UI for an entry
   */
  expect(queryByTestId("experience-entry")).not.toBeInTheDocument();
});

it("renders entries", () => {
  /**
   * Given that experience and associated entries exist in the system
   */
  const edges = [
    {
      node: {
        id: "1",
        fields: [
          {
            defId: "1",
            data: JSON.stringify({
              [FieldType.SINGLE_LINE_TEXT]: "cat man 1"
            })
          }
        ]
      }
    },

    {
      node: {
        id: "2",
        fields: [
          {
            defId: "2",
            data: JSON.stringify({
              [FieldType.MULTI_LINE_TEXT]: "cat man 2"
            })
          }
        ]
      }
    },

    {
      node: {
        id: "3",
        fields: [
          {
            defId: "3",
            data: JSON.stringify({
              [FieldType.DATE]: "2019-05-01"
            })
          }
        ]
      }
    },

    {
      node: {
        id: "4",
        fields: [
          {
            defId: "4",
            data: JSON.stringify({
              [FieldType.DATETIME]: "2019-05-01"
            })
          }
        ]
      }
    },

    {
      node: {
        id: "5",
        fields: [
          {
            defId: "5",
            data: JSON.stringify({
              [FieldType.DECIMAL]: "500.689"
            })
          }
        ]
      }
    },

    {
      node: {
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
    }
  ] as ExperienceFragment_entries_edges[];

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
  ] as ExperienceFragment_fieldDefs[];

  const { ui } = makeComp({
    experience: {
      fieldDefs,

      entries: { edges }
    } as any
  });

  /**
   * When we start using the component
   */
  const { queryByTestId, getByText } = render(ui);

  /**
   * Then we should not see text informing us there are not entries (of course
   * we have several)
   */
  expect(queryByTestId("no-entries")).not.toBeInTheDocument();

  /**
   * And we should see the entries' field names and associated data
   */
  expect(getByText(/field name 1/i)).toBeInTheDocument();
  expect(getByText(/cat man 1/i)).toBeInTheDocument();

  expect(getByText(/field name 2/i)).toBeInTheDocument();
  expect(getByText(/cat man 2/i)).toBeInTheDocument();

  expect(getByText(/field name 3/i)).toBeInTheDocument();
  expect(getByText(/field name 4/i)).toBeInTheDocument();
  expect(getByText(/field name 5/i)).toBeInTheDocument();
  expect(getByText(/field name 6/i)).toBeInTheDocument();
});

it("does not show 'no entries' link if contained in props", () => {
  /**
   * Given that there is experience with no entry in the system
   */
  const { ui } = makeComp({
    experience: {
      entries: {
        edges: []
      }
    } as any,

    doNotShowNoEntriesLink: true
  });

  const { queryByTestId } = render(ui);

  expect(queryByTestId("no-entries")).not.toBeInTheDocument();
});

type P = ComponentType<Partial<Props>>;

function makeComp(props: Partial<Props> = {}) {
  const { Ui, mockNavigate } = renderWithRouter(ExperienceP, {});

  return {
    ui: <Ui {...props} />,
    mockNavigate
  };
}

// tslint:disable: no-any
import React, { ComponentType } from "react";
import "jest-dom/extend-expect";
import "react-testing-library/cleanup-after-each";
import { render, wait, waitForElement } from "react-testing-library";

import { Experience } from "../components/Experience/component";
import { Props } from "../components/Experience/utils";
import { FieldType } from "../graphql/apollo-types/globalTypes";
import {
  GetAnExp_exp_fieldDefs,
  GetAnExp_exp_entries_edges
} from "../graphql/apollo-types/GetAnExp";
import { GetExperienceGqlValues } from "../graphql/get-exp.query";
import { renderWithRouter } from "./test_utils";
import { UnsavedExperience } from "../components/ExperienceDefinition/resolver-utils";
import ApolloClient from "apollo-client";

jest.mock("../components/SidebarHeader", () => ({
  SidebarHeader: jest.fn(() => null)
}));

type P = ComponentType<Partial<Props>>;
const ExperienceP = Experience as P;

afterEach(() => {
  jest.clearAllTimers();
});

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

it("renders ui to show empty entries", () => {
  /**
   * Given that there is experience with no entry in the system
   */
  const { ui } = makeComp({
    getExperienceGql: {
      exp: {
        entries: {
          edges: []
        }
      }
    } as any
  });

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
  ] as GetAnExp_exp_entries_edges[];

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
    getExperienceGql: {
      exp: {
        fieldDefs,

        entries: { edges }
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

it("renders errors while getting experience", async () => {
  /**
   * Given that server returns error
   */
  const { ui, mockNavigate } = makeComp({
    getExperienceGql: { error: {} } as any
  });

  /**
   * While using the component
   */
  const {} = render(ui);

  /**
   * Then we should be redirected to 404 page
   */
  await wait(() => {
    expect(mockNavigate).toBeCalledWith("/404");
  });
});

it("renders unsaved experience when cache is ready", () => {
  /**
   * Given there is unsaved experience in the system
   */

  const unsavedExperience = {
    id: "id",
    title: "unsaved experience",
    entries: {
      edges: []
    } as any
  } as UnsavedExperience;

  const { ui } = makeComp({
    getExperienceGql: undefined,
    unsavedExperienceGql: { unsavedExperience } as any
  });

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

it("renders unsaved experience when cache is not ready", async () => {
  jest.useFakeTimers();

  /**
   * Given there is unsaved experience in the system
   */

  const id = "id";

  const unsavedExperience = {
    id,
    title: "unsaved experience",
    entries: {
      edges: []
    } as any
  } as UnsavedExperience;

  const { ui, query } = makeComp({
    getExperienceGql: undefined,
    unsavedExperienceGql: {
      loading: false
    } as any
  });

  const mockQuery = query as jest.Mock;

  mockQuery.mockResolvedValue({
    data: {
      unsavedExperience
    }
  });

  /**
   * When we use the component
   */
  const { queryByTestId, getByText } = render(ui);

  /**
   * After a little while
   */
  jest.runAllTimers();

  /**
   * Then we should see texts informing us that there are no entries
   */
  const $noEntry = await waitForElement(() =>
    getByText("No entries. Click here to add one")
  );
  expect($noEntry).toBeInTheDocument();

  /**
   * And we should not see any UI for an entry
   */
  expect(queryByTestId("experience-entry")).not.toBeInTheDocument();
});

function makeComp(props: Partial<Props> = {}) {
  const { Ui, mockNavigate } = renderWithRouter(ExperienceP, {});

  const query = jest.fn();
  const client = ({ query } as unknown) as ApolloClient<{}>;

  return {
    ui: <Ui getExperienceGql={{ exp: {} } as any} client={client} {...props} />,
    mockNavigate,
    query
  };
}

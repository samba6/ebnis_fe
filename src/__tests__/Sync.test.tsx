// tslint:disable: no-any
import React, { ComponentType } from "react";
import "jest-dom/extend-expect";
import "react-testing-library/cleanup-after-each";
import { render, fireEvent } from "react-testing-library";
import { Sync } from "../components/Sync/component";
import { Props } from "../components/Sync/utils";
import { ExperienceFragment } from "../graphql/apollo-types/ExperienceFragment";
import { makeUnsavedId } from "../constants";

jest.mock("../components/Loading", () => ({
  Loading: () => <div data-testid="loading" />
}));

jest.mock("../components/SidebarHeader", () => ({
  SidebarHeader: () => <div />
}));

const SyncP = Sync as ComponentType<Partial<Props>>;

it("renders loading indicator while unsaved experiences loading", () => {
  const { ui } = makeComp({
    props: {
      unSavedExperiencesProps: { loading: true } as any
    }
  });

  const { queryByTestId } = render(ui);

  expect(queryByTestId("loading")).toBeInTheDocument();
});

it("renders loading indicator while unsaved entries for saved experiences loading", () => {
  const { ui } = makeComp({
    props: {
      unSavedEntriesSavedExperiencesProps: { loading: true } as any
    }
  });

  const { queryByTestId } = render(ui);

  expect(queryByTestId("loading")).toBeInTheDocument();
});

it("shows there are no unsaved data", () => {
  const { ui } = makeComp({
    props: {
      unSavedExperiencesProps: { unsavedExperiences: [] } as any,
      unSavedEntriesSavedExperiencesProps: {
        unsavedEntriesSavedExperiences: []
      } as any
    }
  });

  const { queryByTestId } = render(ui);

  expect(queryByTestId("loading")).not.toBeInTheDocument();
  expect(queryByTestId("no-unsaved")).toBeInTheDocument();
});

it("does not show saved entries in saved experiences", () => {
  const experiences = [
    {
      id: "1",
      title: "a",

      entries: {
        edges: [
          {
            node: {
              id: makeUnsavedId("1"),

              fields: [
                {
                  defId: "f1",
                  data: `{"decimal":1}`
                }
              ]
            }
          },

          {
            node: {
              id: "2"
            }
          }
        ]
      },

      fieldDefs: [{ id: "f1", type: "DECIMAL" as any }]
    }
  ] as ExperienceFragment[];

  const { ui } = makeComp({
    props: {
      unSavedEntriesSavedExperiencesProps: {
        unsavedEntriesSavedExperiences: experiences
      } as any
    }
  });

  const { queryByTestId, getAllByTestId } = render(ui);

  expect(queryByTestId("no-unsaved")).not.toBeInTheDocument();

  expect(getAllByTestId("saved-experience").length).toBe(1);

  expect(queryByTestId("saved-experiences-menu")).toBeInTheDocument();
  expect(queryByTestId("unsaved-experiences")).not.toBeInTheDocument();
  expect(queryByTestId("unsaved-experiences-menu")).not.toBeInTheDocument();
});

it("shows only 'unsaved experiences' data", () => {
  const { ui } = makeComp({
    props: {
      unSavedExperiencesProps: {
        unsavedExperiences: [
          {
            id: "1",
            title: "a",

            entries: {
              edges: [
                {
                  node: {
                    id: "1",

                    fields: [
                      {
                        defId: "f1",
                        data: `{"decimal":1}`
                      }
                    ]
                  }
                }
              ]
            },

            fieldDefs: [{ id: "f1", type: "DECIMAL" as any }]
          }
        ]
      } as any
    }
  });

  const { queryByTestId } = render(ui);

  expect(queryByTestId("saved-experiences")).not.toBeInTheDocument();
  expect(queryByTestId("saved-experiences-menu")).not.toBeInTheDocument();

  expect(queryByTestId("unsaved-experiences")).toBeInTheDocument();
  expect(queryByTestId("unsaved-experiences-menu")).toBeInTheDocument();
});

it("toggles saved and 'unsaved experiences' data", () => {
  jest.useFakeTimers();

  const { ui } = makeComp({
    props: {
      unSavedExperiencesProps: {
        unsavedExperiences: [
          {
            id: "1",
            title: "a",

            entries: {
              edges: [
                {
                  node: {
                    id: "1",

                    fields: [
                      {
                        defId: "f1",
                        data: `{"decimal":1}`
                      }
                    ]
                  }
                }
              ]
            },

            fieldDefs: [{ id: "f1", type: "DECIMAL" as any }]
          }
        ]
      } as any,

      unSavedEntriesSavedExperiencesProps: {
        unsavedEntriesSavedExperiences: [
          {
            id: "1",
            title: "a",

            entries: {
              edges: [
                {
                  node: {
                    id: makeUnsavedId("1"),

                    fields: [
                      {
                        defId: "f1",
                        data: `{"decimal":1}`
                      }
                    ]
                  }
                }
              ]
            },

            fieldDefs: [{ id: "f1", type: "DECIMAL" as any }]
          }
        ]
      } as any
    }
  });

  const { queryByTestId } = render(ui);

  expect(queryByTestId("saved-experiences")).toBeInTheDocument();
  expect(queryByTestId("unsaved-experiences")).not.toBeInTheDocument();

  const $unsavedMenu = queryByTestId("unsaved-experiences-menu") as any;

  fireEvent.click($unsavedMenu);
  jest.runAllTimers();

  expect(queryByTestId("saved-experiences")).not.toBeInTheDocument();
  expect(queryByTestId("unsaved-experiences")).toBeInTheDocument();

  const $savedMenu = queryByTestId("saved-experiences-menu") as any;

  fireEvent.click($savedMenu);
  jest.runAllTimers();

  expect(queryByTestId("saved-experiences")).toBeInTheDocument();
  expect(queryByTestId("unsaved-experiences")).not.toBeInTheDocument();
});

////////////////////////// HELPER FUNCTIONS ///////////////////////////////////

function makeComp({ props = {} }: { props?: Partial<Props> } = {}) {
  return {
    ui: <SyncP {...props} />
  };
}

export const tabs = {
  context: {
    neverSaved: undefined,
    partlySaved: undefined,
  },

  initial: "unknown",

  states: {
    unknown: {
      on: {
        "": oneOf([
          {
            cond: "hasNeverAndPartlySaved",
            target: "two",
          },

          {
            cond: "hasNeverOrPartlySaved",
            target: "one",
          },

          {
            cond: "hasNoUnsaved",
            target: "none",
          },
        ]),
      },
    },

    two: {
      initial: "partlySaved",

      states: {
        partlySaved: {
          on: {
            TOGGLE_TAB: "neverSaved",
          },
        },

        neverSaved: {
          on: {
            TOGGLE_TAB: "partlySaved",
          },
        },
      },
    },
    one: {},
    none: {},
  },
};

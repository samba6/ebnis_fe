/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-unused-vars */

const editEntry = {
  id: "editEntry",
  context: {
    entry: Entry,
    definitions: [],
    dispatch: DispatchType,
    editFn: EditFn,
  },
  enter: [
    'show UI title as "Edit Entry"', //
    "show experience title",
    "show button to dismiss UI",
  ],

  on: {
    DISMISS: "destroy",
  },

  initial: "nothing",

  states: {
    nothing: {
      parallel: "true",

      states: {
        ...definitionTitle,
        ...dataObjects,
      },
    },

    submitting: {
      enter: [
        "disable editing", //
        "show loading indicator",
      ],

      on: {
        SUCCESS: "success",
        ERROR: "nothing",
      },
    },

    success: {
      type: "final",
      enter: [
        "return edited entry/definition/both", //
      ],
    },

    destroy: {
      type: "final",
      enter: [
        "inform we are destroyed", //
      ],
    },
  },
};

const dataObjects = {
  dataObjects: {
    initial: "pristine",
    states: {
      pristine: {
        enter: [
          "disable submit button", //
          "display initial data object",
        ],

        on: {
          DATA_CHANGED: "dirty",
        },
      },

      dirty: {
        enter: [
          "enable submit button", //
        ],
        on: {
          RESET: "pristine",
          SUBMIT: "submitting",
        },
      },

      submitting: {
        enter: [
          "hand edited data to parent", //
        ],
        on: {
          SUCCESS: {
            target: "finish",
            actions: [
              "show success UI e.g. green checkmark", //
            ],
          },
          ERROR: {
            target: "errors",
            actions: [
              "show errors", //
            ],
          },
        },
      },

      errors: {
        ...errors,
        on: {
          ENTRY_FORM_ERRORS_DISMISS: "dirty",
        },
      },

      finish: {},
    },
  },
};

const errors = {
  initial: "unknown",
  states: {
    unknown: {
      on: {
        "": [
          {
            cond: "hasFormErrors",
            target: "formErrors",
          },

          {
            cond: "hasServerFieldErrors",
            target: "serverFieldErrors",
          },

          {
            cond: "hasGraphQlErrors",
            target: "graphQlErrors",
          },

          {
            cond: "hasOtherErrors",
            target: "otherErrors",
          },
        ],
      },
    },
    formErrors: {},
    serverFieldErrors: {},
    graphQlErrors: {},
    otherErrors: {},
  },
};

const definitionTitle = {
  definitionTitle: {
    context: {
      editingData: false,
    },
    initial: "idle",
    states: {
      idle: {
        enter: [
          "display the definition data type", //
          "display an edit button",
          "display name/title",
        ],
        compound: true,
        on: {
          "": [
            {
              cond: "isEditSuccess",
              target: "editSuccess",
            },

            {
              target: "notEdited",
            },
          ],

          EDIT_BTN_CLICKED: {
            cond: true,
            target: "pristine",
          },
        },

        states: {
          notEdited: {
            enter: [
              "display initial title", //
            ],
          },

          editSuccess: {
            enter: [
              "display new title", //
              "visually indcate edit success",
            ],
          },
        },
      },

      pristine: {
        enter: [
          "title placed in text box for editing", //
          "show dismiss button",
          "hide edit button",
        ],

        on: {
          TITLE_CHANGED: {
            target: "dirty",
            actions: [
              "remove dismiss button", //
            ],
          },

          TITLE_EDIT_DISMISS: "idle",
        },
      },

      dirty: {
        on: {
          TITLE_RESET: "pristine",
        },

        initial: "unknown",

        states: {
          unknown: {
            "": [
              {
                cond: "isEditingData",
                target: "editingData",
              },

              {
                target: "notEditingData",
              },
            ],
          },

          notEditingData: {
            initial: "nothing",
            states: {
              nothing: {
                on: {
                  SUBMIT: {
                    target: "submitting",
                    actions: [
                      "set submitting context", //
                    ],
                  },
                },
              },

              submitting: {
                entry: [
                  "disable edit e.g. by showing an overlay", //
                  "show loading indicator",
                ],

                exit: [
                  "enable editing e.g. by removing overlay",
                  "remove loading indicator",
                ],
                on: {
                  SUCCESS: {
                    target: "#definitionTitle.idle",
                    actions: [
                      "set success context", //
                    ],
                  },

                  ERROR: {
                    target: "#definitionTitle.errors",
                    actions: [
                      "set errors context", //
                    ],
                  },
                },
              },
            },
          },

          editingData: {
            initial: "nothing",
            states: {
              initial: {
                on: {
                  ENTRY_FORM_SUBMIT: "submitting",
                },
              },

              submitting: {
                on: {
                  SUCCESS: {
                    target: "#definitionTitle.idle",
                    actions: [
                      "set success context", //
                    ],
                  },

                  ERROR: {
                    target: "#definitionTitle.errors",
                    actions: [
                      "set error context", //
                    ],
                  },
                },
              },
            },
          },
        },
      },

      errors: {
        ...errors,
        entry: [
          "show errors", //
        ],

        exit: [
          "dismiss errors", //
        ],

        on: {
          ENTRY_FORM_ERRORS_DISMISS: "dirty",
        },
      },
    },
  },
};

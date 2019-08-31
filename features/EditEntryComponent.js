/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-unused-vars */

const editEntryComponent = {
  id: "editEntryComponent",
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
    DISMISS: {
      cond: "weAreNotSubmitting",
      target: "destroy",
    },
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

const dataObject = {
    initial: "unchanged",
    states: {
      unchanged: {
        context: {
          anyEditSuccessful?: true
        },

        enter: [
          "if nothing changed, disable submit button", //
          "display default data object",
        ],

        on: {
          DATA_CHANGED: "changed",
        },
      },

      changed: {
        context: {
          formValue: {}
        },
        enter: [
          "enable submit button", //
        ],
        on: {
          SUBMIT: "submitting",
        },
      },

      states: {

      submitting: {
        enter: [
          "hand edited data to parent", //
        ],

        on: {
          SUCCESS: {
            target: "unchanged",
            actions: [
              "show success UI e.g. green checkmark", //
            ],
          },

          DATA_FORM_ERROR: {
            target: "formErrors",
            actions: [
              "show errors", //
            ],
          },

          DATA_SERVER_ERRORS: 'serverErrors'
        },
      },

      formErrors: {
        context: {
          errors: {}
        }
      },
        serverErrors: {
          context: {
            errors: {}
          }
        }
    }

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

const definition = {
  id: "definition",

  initial: "idle",

  states: {
    idle: {
      enter: [`show default name, data type`],

      on: {
        "": [
          {
            cond: "isAnyEditSuccessful",
            target: "hasSuccessfulEdit",
          },
        ],

        EDIT_BTN_CLICKED: "editing",
      },

      states: {
        hasSuccessfulEdit: {
          enter: [
            `visually show definition has been successfully
            edited at least once`,
          ],
        },
      },
    },

    editing: {
      enter: [`Place definition name in input form control`],

      on: {
        STOP_DEFINITION_EDIT: "idle",
      },

      initial: "unchanged",

      states: {
        unchanged: {
          on: {
            DEFINITION_NAME_CHANGED: "changed.form",
          },
        },

        changed: {
          on: {
            UNDO_DEFINITION_EDITS: "unchanged",

            DEFINITION_NAME_CHANGED: "form",
          },

          parallel: true,

          states: {
            form: {
              on: {
                "": [
                  {
                    cond: "isNotEditingData",
                    target: "notEditingData",
                  },
                ],
              },

              initial: "regular",

              states: {
                regular: {},

                submitting: {
                  on: {
                    "": "editEntry.submitting",

                    SUCCESS: "idle.anyEditSuccessful",

                    DEFINITION_FORM_ERRORS: "formErrors",

                    DEFINITION_SERVER_ERRORS: "serverErrors",
                  },
                },

                formErrors: {
                  ...errors,
                },

                serverErrors: {
                  ...errors,
                },
              },
            },

            notEditingData: {
              on: {
                "": [
                  {
                    cond: "isEditingSiblings",
                    target: "editingSiblings",
                  },

                  {
                    cond: "isNotEditingSiblings",
                    target: "notEditingSiblings",
                  },
                ],
              },

              states: {
                editingSiblings: {
                  on: {
                    "": [
                      {
                        cond: "isFirstEditableSibling",
                        target: "firstEditableSibling",
                      },
                    ],
                  },

                  states: {
                    firstEditableSibling: {
                      on: {
                        SUBMIT_DEFINITION: "form.submitting",
                      },
                    },
                  },
                },

                notEditingSiblings: {
                  on: {
                    SUBMIT_DEFINITION: "form.submitting",
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

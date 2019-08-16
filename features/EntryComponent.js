export const EntryComponent = {
  id: "EntryComponent",
  initial: "idle",
  enter: [
    "for each data object, show definition name, show data",
    "for each entry, show create and modify dates",
    "an options menu with actions - edit, delete",
  ],
  states: {
    idle: {
      on: {
        editClicked: "EditEntryComponent",
      },
    },
  },
};

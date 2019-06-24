// tslint:disable: no-any
import { onUploadSuccessUpdate } from "../components/Sync/mutation-update";
import { makeEntryNode, makeFieldDefs } from "./test_utils";
import { makeUnsavedId } from "../constants";

const mockDataProxy = {
  writeQuery: jest.fn()
} as any;

it("unsaved entries successfully", async done => {
  const unsavedExperience = {
    id: "1",
    title: "a",

    entries: {
      edges: [
        {
          node: { ...makeEntryNode(), clientId: "a" }
        }
      ]
    },

    fieldDefs: makeFieldDefs()
  };

  const savedExperienceUnsavedEntry = {
    ...makeEntryNode(makeUnsavedId("1")),
    clientId: "b"
  } as any;

  const savedExperience = {
    id: "1",
    title: "a",

    entries: {
      edges: [
        {
          node: savedExperienceUnsavedEntry
        }
      ]
    },

    fieldDefs: makeFieldDefs()
  } as any;

  onUploadSuccessUpdate({
    "1": {
      experience: savedExperience,
      unsavedEntries: [savedExperienceUnsavedEntry]
    }
  })(mockDataProxy, {});

  done();
});

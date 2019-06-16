import { MutationUpdaterFn } from "react-apollo";
import immer from "immer";

// istanbul ignore next: why flag import?
import { CreateAnEntry } from "../../graphql/apollo-types/CreateAnEntry";
import {
  GetAnExp,
  GetAnExpVariables,
  GetAnExp_exp,
  GetAnExp_exp_entries
} from "../../graphql/apollo-types/GetAnExp";
import { GET_EXP_QUERY } from "../../graphql/get-exp.query";

// TODO: will be tested in e2e
// istanbul ignore next: trust apollo to do the right thing -
export const updateExperienceWithNewEntry: (
  expId: string
) => MutationUpdaterFn<CreateAnEntry> = function updateFn(expId: string) {
  return async function updateFnInner(dataProxy, { data: newEntryEntry }) {
    if (!newEntryEntry) {
      return;
    }

    const { entry } = newEntryEntry;

    if (!entry) {
      return;
    }

    const variables = {
      exp: { id: expId },
      pagination: {
        first: 20
      }
    };

    const data = dataProxy.readQuery<GetAnExp, GetAnExpVariables>({
      query: GET_EXP_QUERY,
      variables
    });

    if (!data) {
      return;
    }

    const exp = data.exp as GetAnExp_exp;

    const updatedExperience = immer(exp, draft => {
      const entries = draft.entries as GetAnExp_exp_entries;
      const edges = entries.edges || [];
      edges.push({
        node: entry,
        cursor: "",
        __typename: "EntryEdge"
      });

      entries.edges = edges;
      draft.entries = entries;
    });

    await dataProxy.writeQuery({
      query: GET_EXP_QUERY,
      variables,
      data: {
        exp: updatedExperience
      }
    });

    return updatedExperience;
  };
};

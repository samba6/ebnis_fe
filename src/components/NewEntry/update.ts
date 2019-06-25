import { MutationUpdaterFn } from "react-apollo";
import immer from "immer";

// istanbul ignore next: why flag import?
import { CreateEntryMutation } from "../../graphql/apollo-types/CreateEntryMutation";
import {
  GetExperienceFull,
  GetExperienceFullVariables,
  GetExperienceFull_exp,
  GetExperienceFull_exp_entries
} from "../../graphql/apollo-types/GetExperienceFull";
import { GET_EXP_QUERY } from "../../graphql/get-experience-full.query";

// istanbul ignore next: trust apollo to do the right thing -
export const updateExperienceWithNewEntry: (
  expId: string
) => MutationUpdaterFn<CreateEntryMutation> = function updateFn(expId: string) {
  return async function updateFnInner(dataProxy, { data: newEntryEntry }) {
    if (!newEntryEntry) {
      return;
    }

    const { entry } = newEntryEntry;

    if (!entry) {
      return;
    }

    const variables: GetExperienceFullVariables = {
      exp: {
        id: expId
      },

      entriesPagination: {
        first: 20
      }
    };

    const data = dataProxy.readQuery<
      GetExperienceFull,
      GetExperienceFullVariables
    >({
      query: GET_EXP_QUERY,
      variables
    });

    if (!data) {
      return;
    }

    const exp = data.exp as GetExperienceFull_exp;

    const updatedExperience = immer(exp, proxy => {
      const entries = proxy.entries as GetExperienceFull_exp_entries;
      const edges = entries.edges || [];

      edges.push({
        node: entry,
        cursor: "",
        __typename: "EntryEdge"
      });

      entries.edges = edges;
      proxy.entries = entries;
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

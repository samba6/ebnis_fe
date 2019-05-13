import { MutationUpdaterFn } from "react-apollo";

// istanbul ignore next: why flag import?
import { GET_EXP_ENTRIES_QUERY } from "../../graphql/exp-entries.query";
import { CreateAnEntry } from "../../graphql/apollo-types/CreateAnEntry";
import {
  GetExpAllEntries,
  GetExpAllEntriesVariables
} from "../../graphql/apollo-types/GetExpAllEntries";

// TODO: will be tested in e2e
// istanbul ignore next: trust apollo to do the right thing -
export const update: (
  expId: string
) => MutationUpdaterFn<CreateAnEntry> = function updateFn(expId: string) {
  return async function updateFnInner(client, { data: newEntry }) {
    if (!newEntry) {
      return;
    }

    const { entry } = newEntry;

    if (!entry) {
      return;
    }

    const variables = {
      entry: { expId }
    };

    const data = client.readQuery<GetExpAllEntries, GetExpAllEntriesVariables>({
      query: GET_EXP_ENTRIES_QUERY,
      variables
    });

    if (!data) {
      return;
    }

    await client.writeQuery({
      query: GET_EXP_ENTRIES_QUERY,
      variables,
      data: {
        expEntries: [...(data.expEntries || []), entry]
      }
    });
  };
};

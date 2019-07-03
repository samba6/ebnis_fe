import { InMemoryCache } from "apollo-cache-inmemory";

export function deleteIdsFromCache(
  dataProxy: InMemoryCache,
  ids: string[],
  mutationsAndQueries?: {
    mutations?: [string, string][];
    queries?: [string, string][];
  },
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cache = dataProxy as any;
  const dataClass = cache.data;
  const data = dataClass.data;
  let count = 0;

  let rootQuery: { [k: string]: { id: string } } = {};
  let rootMutation: { [k: string]: { id: string } } = {};

  ids.forEach(id => {
    const idRegex = new RegExp(id);

    Object.keys(data).forEach(k => {
      if (idRegex.test(k)) {
        delete data[k];
        ++count;
        return;
      }

      if (k === "ROOT_QUERY") {
        rootQuery = data.ROOT_QUERY;

        return;
      }

      if (k === "ROOT_MUTATION") {
        rootMutation = data.ROOT_MUTATION;

        return;
      }
    });
  });

  if (mutationsAndQueries) {
    let { mutations, queries } = mutationsAndQueries;

    count += deleteOperations(rootMutation, mutations);
    count += deleteOperations(rootQuery, queries);
  }

  // I think broadcastWatches will serve same purpose.
  // ids.forEach(id => dataClass.delete(id));

  cache.broadcastWatches();

  return count;
}

function deleteOperations(
  rootOperations: { [k: string]: { id: string } },
  operations?: [string, string][],
) {
  if (!operations) {
    return 0;
  }

  if (operations.length === 0) {
    return 0;
  }

  let count = 0;

  const operationsMap = operations.reduce(
    (acc, [operationName, id]) => {
      const mIds = acc[operationName] || [];
      mIds.push(id);
      acc[operationName] = mIds;

      return acc;
    },
    {} as { [k: string]: string[] },
  );

  Object.entries(operationsMap).forEach(([operationName, mIds]) => {
    Object.keys(rootOperations).forEach(mk => {
      if (mk.includes(operationName)) {
        const { id } = rootOperations[mk];

        if (id) {
          mIds.forEach(mid => {
            if (id === mid) {
              delete rootOperations[mk];
              ++count;
            }
          });
        }
      }
    });
  });

  return count;
}

export function removeMutationsFromCache(
  dataProxy: InMemoryCache,
  mutations: string[],
) {
  if (mutations.length === 0) {
    return 0;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cache = dataProxy as any;
  const dataClass = cache.data;
  const data = dataClass.data;
  let count = 0;

  // tslint:disable-next-line:no-console
  console.log(
    "\n\t\tLogging start\n\n\n\n data\n",
    { ...data },
    "\n\n\n\n\t\tLogging ends\n",
  );

  Object.keys(data).forEach(k => {
    mutations.forEach(m => {
      if (k === "ROOT_MUTATION") {
        const rootMutation = data[k];

        Object.keys(rootMutation).forEach(mk => {
          if (mk.includes(m)) {
            // tslint:disable-next-line:no-console
            console.log(
              "\n\t\tLogging start\n\n\n\n k, m mk\n",
              k,
              "|||",
              m,
              "|||",
              mk,
              "\n\n\n\n\t\tLogging ends\n",
            );

            delete rootMutation[k];
            ++count;
          }
        });
      }

      if (k.includes(m)) {
        // tslint:disable-next-line:no-console
        console.log(
          "\n\t\tLogging start\n\n\n\n k\n",
          k,
          "\n\n\n\n\t\tLogging ends\n",
        );

        delete data[k];
        ++count;
        return;
      }
    });
  });

  // cache.broadcastWatches();

  // tslint:disable-next-line:no-console
  console.log(
    "\n\t\tLogging start\n\n\n\n count\n",
    count,
    "\n\n\n\n\t\tLogging ends\n",
  );

  return count;
}

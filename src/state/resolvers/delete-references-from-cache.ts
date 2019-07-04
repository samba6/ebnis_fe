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

export function removeQueriesAndMutationsFromCache(
  dataProxy: InMemoryCache,
  operations: string[],
) {
  if (operations.length === 0) {
    return 0;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cache = dataProxy as any;
  const dataClass = cache.data;
  const data = dataClass.data;
  let count = 0;

  for (const dataKey of Object.keys(data)) {
    if (dataKey === "ROOT_MUTATION" || dataKey === "ROOT_QUERY") {
      const rootOperation = data[dataKey];

      for (const rootKey of Object.keys(rootOperation)) {
        for (const operationName of operations) {
          if (rootKey.startsWith(operationName)) {
            delete rootOperation[rootKey];
            ++count;
            break;
          }
        }
      }

      continue;
    }

    if (
      dataKey.startsWith("ROOT_MUTATION") ||
      dataKey.startsWith("$ROOT_QUERY")
    ) {
      for (const operationName of operations) {
        if (dataKey.includes(operationName)) {
          delete data[dataKey];
          ++count;
          break;
        }
      }
    }
  }

  return count;
}

import { InMemoryCache } from "apollo-cache-inmemory";

export function wipeReferencesFromCache(
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

  ids.forEach(id => {
    const idRegex = new RegExp(id);

    Object.keys(data).forEach(k => {
      if (idRegex.test(k)) {
        delete data[k];
        ++count;
        return;
      }
    });
  });

  const rootQuery = data["ROOT_QUERY"] as { [k: string]: { id: string } };
  const rootMutation = data["ROOT_MUTATION"] as { [k: string]: { id: string } };

  if (mutationsAndQueries) {
    const { mutations, queries } = mutationsAndQueries;

    count += deleteOperations(rootMutation, mutations);
    count += deleteOperations(rootQuery, queries);
  }

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

  const operationsMap = operations.reduce((acc, [operationName, operationId]) => {
    const operationIds = acc[operationName] || [];
    operationIds.push(operationId);
    acc[operationName] = operationIds;

    return acc;
  }, {} as { [k: string]: string[] });

  Object.entries(operationsMap).forEach(([operationName, methodIds]) => {
    Object.keys(rootOperations).forEach(method => {
      if (method.includes(operationName)) {
        const { id } = rootOperations[method];

        if (id) {
          methodIds.forEach(methodId => {
            if (id === methodId) {
              delete rootOperations[method];
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
      dataKey.startsWith("$ROOT_MUTATION") ||
      dataKey.startsWith("$ROOT_QUERY") ||
      dataKey.startsWith("ROOT_MUTATION") ||
      dataKey.startsWith("ROOT_QUERY")
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

  cache.broadcastWatches();
  return count;
}

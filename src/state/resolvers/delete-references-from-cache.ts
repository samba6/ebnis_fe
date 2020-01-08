import { InMemoryCache } from "apollo-cache-inmemory";

/**
 * May this function can be combined with the one below. We'll
 * -------------------------------------------------------
 * Things to delete:
 * 3. TYPE_NAME:Id i.e apollo cacheKey
 */
export function wipeReferencesFromCache(
  dataProxy: InMemoryCache,
  ids: string[],
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

  cache.broadcastWatches();
  return count;
}

/**
 * Things to remove:
 * 1. data.ROOT_QUERY.query_name
 * 2. data.$ROOT_QUERY.query_name.0 (i.e normalized result(s) of 1,
 *     if result is a list)
 * 3. TYPE_NAME:Id i.e apollo cacheKey
 */

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

    // dataKey === { ROOT_QUERY | ROOT_MUTATION}.operationName
    // dataKey === $ROOT_QUERY.queryName.0
    if (
      dataKey.startsWith("$ROOT_MUTATION") ||
      dataKey.startsWith("$ROOT_QUERY") ||
      dataKey.startsWith("ROOT_QUERY") ||
      dataKey.startsWith("ROOT_MUTATION")
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

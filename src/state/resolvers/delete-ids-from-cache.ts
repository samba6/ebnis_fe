import { InMemoryCache } from "apollo-cache-inmemory";

export function deleteIdsFromCache(dataProxy: InMemoryCache, ids: string[]) {
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

      if (k === "ROOT_QUERY") {
        const rootQuery = data.ROOT_QUERY;

        Object.keys(rootQuery).forEach(rk => {
          if (idRegex.test(rk)) {
            ++count;
            delete rootQuery[rk];
          }
        });

        return;
      }

      if (k === "ROOT_MUTATION") {
        const rootMutation = data.ROOT_MUTATION;

        Object.keys(rootMutation).forEach(rk => {
          if (idRegex.test(rk)) {
            ++count;
            delete rootMutation[rk];
          }
        });

        return;
      }
    });
  });

  ids.forEach(id => dataClass.delete(id));

  cache.broadcastWatches();

  return count;
}
